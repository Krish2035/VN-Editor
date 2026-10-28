import { Response } from 'express';
import { TracedRequest } from '../middleware/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ASSETS_FILE, UPLOAD_DIR } from '../services/storageService';
import { extractMetadata, extractWaveform } from '../services/waveformService';
import { MediaAsset } from '../types';

const getAllAssets = (): MediaAsset[] => {
  try {
    const raw = fs.readFileSync(ASSETS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveAssets = (assets: MediaAsset[]) => {
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(assets, null, 2), 'utf-8');
};

export const listAssets = (req: TracedRequest, res: Response) => {
  const assets = getAllAssets();
  res.json({ success: true, count: assets.length, data: assets });
};

export const uploadMedia = async (req: TracedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No media file provided' });
    }

    const assetId = `asset_${uuidv4().substring(0, 8)}`;
    const originalExt = path.extname(file.originalname);
    const targetFilename = `${assetId}${originalExt}`;
    const targetPath = path.join(UPLOAD_DIR, targetFilename);

    // Move uploaded file to target location
    fs.renameSync(file.path, targetPath);

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
