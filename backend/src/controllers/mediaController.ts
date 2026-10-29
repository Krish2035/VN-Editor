import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ASSETS_FILE, UPLOAD_DIR } from '../services/storageService';
import { extractMetadata, extractWaveform } from '../services/waveformService';
import { generatePresignedUploadUrl } from '../services/s3Service';
import { prisma, isDatabaseConnected } from '../config/db';
import { MediaAsset } from '../types';

const getAllAssets = (): MediaAsset[] => {
  try {
    if (!fs.existsSync(ASSETS_FILE)) {
      fs.writeFileSync(ASSETS_FILE, JSON.stringify([]), 'utf-8');
    }
    const raw = fs.readFileSync(ASSETS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAssets = (assets: MediaAsset[]) => {
  const tmpFile = `${ASSETS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(assets, null, 2), 'utf-8');
  try {
    fs.renameSync(tmpFile, ASSETS_FILE);
  } catch {
    fs.copyFileSync(tmpFile, ASSETS_FILE);
    fs.unlinkSync(tmpFile);
  }
};

/**
 * Cross-filesystem safe file move (handles EXDEV in Linux/Docker/Windows)
 */
const moveFileSafe = (sourcePath: string, destinationPath: string) => {
  try {
    fs.renameSync(sourcePath, destinationPath);
  } catch (err: any) {
    if (err.code === 'EXDEV' || err.code === 'EPERM') {
      fs.copyFileSync(sourcePath, destinationPath);
      fs.unlinkSync(sourcePath);
    } else {
      throw err;
    }
  }
};

/**
 * Lists media assets with multi-tenant isolation (Pillars 112: IDOR Protection)
 */
export const listAssets = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'guest_user';

  if (isDatabaseConnected) {
    try {
      const dbAssets = await prisma.mediaAsset.findMany({
        where: {
          OR: [{ userId }, { userId: 'guest_user' }]
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted: MediaAsset[] = dbAssets.map((a) => ({
        id: a.id,
        userId: a.userId,
        filename: a.filename,
        originalName: a.originalName,
        mimeType: a.mimeType,
        size: Number(a.size),
        durationSec: a.durationSec || 0,
        width: a.width || undefined,
        height: a.height || undefined,
        url: a.url,
        waveformData: a.waveformDataJson ? JSON.parse(a.waveformDataJson) : undefined,
        createdAt: a.createdAt.toISOString()
      }));

      return res.json({ success: true, count: formatted.length, data: formatted });
    } catch (err: any) {
      console.warn('Prisma media listing fallback to local store:', err.message);
    }
  }

  // Local fallback persistence with tenant isolation
  const allAssets = getAllAssets();
  const userAssets = allAssets.filter(
    (a) => !a.userId || a.userId === userId || a.userId === 'guest_user' || req.user?.role === 'ADMIN'
  );

  res.json({ success: true, count: userAssets.length, data: userAssets });
};

/**
 * Generate Presigned S3 / R2 Direct Upload URL (Pillars 48, 88)
 */
export const getPresignedUpload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename, mimeType } = req.body;
    if (!filename || !mimeType) {
      return res.status(400).json({ success: false, error: 'filename and mimeType are required' });
    }

    const userId = req.user?.id || 'guest_user';
    const presignedData = await generatePresignedUploadUrl(filename, mimeType, userId);

    res.json({
      success: true,
      data: presignedData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Secure media file upload handler with metadata extraction
 */
export const uploadMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No media file provided' });
    }

    const userId = req.user?.id || 'guest_user';
    const assetId = `asset_${uuidv4().substring(0, 8)}`;
    const originalExt = path.extname(file.originalname);
    const targetFilename = `${assetId}${originalExt}`;
    const targetPath = path.join(UPLOAD_DIR, targetFilename);

    // Safely move uploaded file across filesystems
    moveFileSafe(file.path, targetPath);

    // Extract duration, dimensions, and audio waveform
    let metadata: { durationSec: number; width?: number; height?: number; fps?: number } = {
      durationSec: 0,
      width: undefined,
      height: undefined,
      fps: 30
    };
    let waveform: number[] = [];

    try {
      metadata = await extractMetadata(targetPath);
      waveform = await extractWaveform(targetPath, 100);
    } catch (analysisErr) {
      console.warn('Metadata analysis warning (using defaults):', analysisErr);
    }

    const newAsset: MediaAsset = {
      id: assetId,
      userId,
      filename: targetFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      durationSec: metadata.durationSec,
      width: metadata.width,
      height: metadata.height,
      url: `/uploads/${targetFilename}`,
      waveformData: waveform,
      createdAt: new Date().toISOString()
    };

    if (isDatabaseConnected) {
      try {
        await prisma.mediaAsset.create({
          data: {
            id: newAsset.id,
            userId,
            filename: newAsset.filename,
            originalName: newAsset.originalName,
            mimeType: newAsset.mimeType,
            size: BigInt(newAsset.size),
            durationSec: newAsset.durationSec,
            width: newAsset.width,
            height: newAsset.height,
            url: newAsset.url,
            waveformDataJson: waveform.length > 0 ? JSON.stringify(waveform) : null
          }
        });
      } catch (dbErr: any) {
        console.warn('Prisma media creation warning:', dbErr.message);
      }
    }

    // Persist to local fallback store
    const assets = getAllAssets();
    assets.unshift(newAsset);
    saveAssets(assets);

    res.status(201).json({
      success: true,
      message: 'Media uploaded and processed successfully',
      data: newAsset
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process uploaded media',
      details: err.message
    });
  }
};
