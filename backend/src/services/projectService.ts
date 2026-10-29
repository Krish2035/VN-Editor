import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { VNProject } from '../types';
import { PROJECTS_FILE } from './storageService';

export const getAllProjects = (): VNProject[] => {
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getProjectById = (id: string): VNProject | null => {
  const projects = getAllProjects();
  return projects.find((p) => p.id === id) || null;
};

export const saveProject = (projectData: Partial<VNProject>): VNProject => {
  const projects = getAllProjects();
  const now = new Date().toISOString();

  let project: VNProject;
  const existingIdx = projects.findIndex((p) => p.id === projectData.id);

  if (existingIdx >= 0) {
    project = {
      ...projects[existingIdx],
      ...projectData,
      version: (projects[existingIdx].version || 1) + 1,
      updatedAt: now
    };
    projects[existingIdx] = project;
  } else {
    project = {
      id: projectData.id || `vn_proj_${uuidv4().substring(0, 8)}`,
      userId: projectData.userId || 'guest_user',
      title: projectData.title || 'Untitled VN Project',
      version: 1,
      createdAt: now,
      updatedAt: now,
      canvas: projectData.canvas || {
        width: 1920,
        height: 1080,
        fps: 60,
        aspectRatio: '16:9',
        durationMs: 30000
      },
      tracks: projectData.tracks || createDefaultTracks(),
      settings: projectData.settings || {
        snapToGrid: true,
        rippleEdit: true,
        magnetic: true
      }
    };
    projects.unshift(project);
  }

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  return project;
};

export const deleteProject = (id: string): boolean => {
  let projects = getAllProjects();
  const initialLength = projects.length;
  projects = projects.filter((p) => p.id !== id);

  if (projects.length !== initialLength) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
    return true;
  }
  return false;
};

export const createDefaultProject = (userId: string = 'guest_user', title: string = 'Untitled VN Project'): VNProject => {
  const now = new Date().toISOString();
  return {
    id: `vn_proj_${uuidv4().substring(0, 8)}`,
    userId,
    title,
    version: 1,
    createdAt: now,
    updatedAt: now,
    canvas: {
      width: 1920,
      height: 1080,
      fps: 60,
      aspectRatio: '16:9',
      durationMs: 30000
    },
    tracks: createDefaultTracks(),
    settings: {
      snapToGrid: true,
      rippleEdit: true,
      magnetic: true
    }
  };
};

export const createDefaultTracks = () => [
  {
    id: `track_text_${uuidv4().substring(0, 6)}`,
    type: 'text' as const,
    name: 'Subtitles & Text',
    muted: false,
    locked: false,
    clips: []
  },
  {
    id: `track_pip_${uuidv4().substring(0, 6)}`,
    type: 'pip' as const,
    name: 'PIP & Overlays',
    muted: false,
    locked: false,
    clips: []
  },
  {
    id: `track_video_${uuidv4().substring(0, 6)}`,
    type: 'video' as const,
    name: 'Main Video Track',
    muted: false,
    locked: false,
    clips: []
  },
  {
    id: `track_audio_${uuidv4().substring(0, 6)}`,
    type: 'audio' as const,
    name: 'Background Music',
    muted: false,
    locked: false,
    clips: []
  },
  {
    id: `track_sfx_${uuidv4().substring(0, 6)}`,
    type: 'sfx' as const,
    name: 'Sound Effects',
    muted: false,
    locked: false,
    clips: []
  }
];
