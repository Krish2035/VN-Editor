import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as dbProjectService from '../services/dbProjectService';

export const listProjects = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'guest_user';
  const projects = await dbProjectService.listUserProjects(userId);
  res.json({ success: true, count: projects.length, data: projects });
};

export const getProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || 'guest_user';
  const project = await dbProjectService.getUserProject(id, userId);

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found or unauthorized' });
  }
  res.json({ success: true, data: project });
};

export const createOrUpdateProject = async (req: AuthenticatedRequest, res: Response) => {
  const projectData = req.body?.projectData || req.body;
  if (!projectData || Object.keys(projectData).length === 0) {
    return res.status(400).json({ success: false, error: 'Project data is required' });
  }

  const userId = req.user?.id || 'guest_user';
  const saved = await dbProjectService.saveUserProject(projectData, userId);
  res.status(200).json({ success: true, data: saved });
};

export const removeProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id || 'guest_user';
  const deleted = await dbProjectService.deleteUserProject(id, userId);

  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Project not found or unauthorized' });
  }
  res.json({ success: true, message: 'Project successfully deleted' });
};
