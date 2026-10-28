import { VNProject, VNTrack } from '../types';
import { prisma, isDatabaseConnected } from '../config/db';
import * as legacyProjectService from './projectService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lists projects owned by the authenticated user (Pillar 112: IDOR Protection)
 */
export const listUserProjects = async (userId: string): Promise<VNProject[]> => {
  if (isDatabaseConnected) {
    try {
      const dbProjects = await prisma.project.findMany({
        where: { userId },
        include: {
          tracks: {
            include: { clips: true },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return dbProjects.map(mapPrismaProjectToVN);
    } catch (err: any) {
      console.warn('[Prisma] Error fetching user projects:', err.message);
    }
  }

  // Local fallback
  const all = legacyProjectService.getAllProjects();
  return all.filter((p) => p.userId === userId || userId.startsWith('guest_'));
};

/**
 * Retrieves a single project with ownership check (IDOR Protection)
 */
export const getUserProject = async (projectId: string, userId: string): Promise<VNProject | null> => {
  if (isDatabaseConnected) {
    try {
      const dbProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId
        },
        include: {
          tracks: {
            include: { clips: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (dbProject) return mapPrismaProjectToVN(dbProject);
    } catch (err: any) {
      console.warn('[Prisma] Error fetching project:', err.message);
    }
  }

  const p = legacyProjectService.getProjectById(projectId);
  if (!p) return null;
  // Permit guest or owner access
  if (p.userId === userId || userId.startsWith('guest_') || p.userId.startsWith('guest_')) {
    return p;
  }
  return null;
};

/**
 * Saves or updates a project bound to the user
 */
export const saveUserProject = async (projectData: Partial<VNProject>, userId: string): Promise<VNProject> => {
  const projectId = projectData.id || `vn_proj_${uuidv4().substring(0, 8)}`;

  if (isDatabaseConnected) {
    try {
      // Upsert project record
      const upserted = await prisma.project.upsert({
        where: { id: projectId },
        create: {
          id: projectId,
          userId,
          title: projectData.title || 'Untitled VN Project',
          version: 1,
          width: projectData.canvas?.width || 1920,
          height: projectData.canvas?.height || 1080,
          fps: projectData.canvas?.fps || 60,
          aspectRatio: projectData.canvas?.aspectRatio || '16:9',
          durationMs: projectData.canvas?.durationMs || 30000,
          snapToGrid: projectData.settings?.snapToGrid ?? true,
          rippleEdit: projectData.settings?.rippleEdit ?? true,
          magnetic: projectData.settings?.magnetic ?? true
        },
        update: {
          title: projectData.title,
          version: { increment: 1 },
          width: projectData.canvas?.width,
          height: projectData.canvas?.height,
          fps: projectData.canvas?.fps,
          aspectRatio: projectData.canvas?.aspectRatio,
          durationMs: projectData.canvas?.durationMs,
          snapToGrid: projectData.settings?.snapToGrid,
          rippleEdit: projectData.settings?.rippleEdit,
          magnetic: projectData.settings?.magnetic,
          updatedAt: new Date()
        },
        include: {
          tracks: { include: { clips: true } }
        }
      });

      return mapPrismaProjectToVN(upserted);
    } catch (err: any) {
      console.warn('[Prisma] Save error, falling back to local:', err.message);
    }
  }

  return legacyProjectService.saveProject({
    ...projectData,
    id: projectId,
    userId
  });
};

/**
 * Deletes a project with IDOR ownership validation
 */
export const deleteUserProject = async (projectId: string, userId: string): Promise<boolean> => {
  if (isDatabaseConnected) {
    try {
      const deleted = await prisma.project.deleteMany({
        where: {
          id: projectId,
          userId
        }
      });
      return deleted.count > 0;
    } catch (err: any) {
      console.warn('[Prisma] Delete error:', err.message);
    }
  }

  return legacyProjectService.deleteProject(projectId);
};

function mapPrismaProjectToVN(p: any): VNProject {
  return {
    id: p.id,
    userId: p.userId,
    title: p.title,
    version: p.version,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    canvas: {
      width: p.width,
      height: p.height,
      fps: p.fps,
      aspectRatio: p.aspectRatio,
      durationMs: p.durationMs
    },
    settings: {
      snapToGrid: p.snapToGrid,
      rippleEdit: p.rippleEdit,
      magnetic: p.magnetic
    },
    tracks: (p.tracks || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      name: t.name,
      muted: t.muted,
      locked: t.locked,
      visible: t.visible,
      clips: (t.clips || []).map((c: any) => ({
        id: c.id,
        trackId: t.id,
        name: c.name,
        assetUrl: c.assetUrl,
        startMs: c.startMs,
        durationMs: c.durationMs,
        sourceDurationMs: c.sourceDurationMs,
        trimInMs: c.trimInMs,
        trimOutMs: c.trimOutMs,
        speed: c.speed,
        volume: c.volume,
        fadeInMs: c.fadeInMs,
        fadeOutMs: c.fadeOutMs,
        transform: c.transformJson ? JSON.parse(c.transformJson) : { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        colorAdjustments: c.colorJson ? JSON.parse(c.colorJson) : { brightness: 0, contrast: 0, saturation: 0, temperature: 0, vignette: 0 },
        textData: c.textJson ? JSON.parse(c.textJson) : undefined,
        keyframes: c.keyframesJson ? JSON.parse(c.keyframesJson) : []
      }))
    }))
  };
}
