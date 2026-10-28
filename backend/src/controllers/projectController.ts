import { Response } from 'express';
import { TracedRequest } from '../middleware/logger';
import * as projectService from '../services/projectService';

export const listProjects = (req: TracedRequest, res: Response) => {
  const projects = projectService.getAllProjects();
  res.json({ success: true, count: projects.length, data: projects });
};

export const getProject = (req: TracedRequest, res: Response) => {
  const { id } = req.params;
  const project = projectService.getProjectById(id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, data: project });
};

export const createOrUpdateProject = (req: TracedRequest, res: Response) => {
  const projectData = req.body;
  if (!projectData) {
    return res.status(400).json({ success: false, error: 'Project data is required' });
  }
  const saved = projectService.saveProject(projectData);
  res.status(200).json({ success: true, data: saved });
};

export const removeProject = (req: TracedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = projectService.deleteProject(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, message: 'Project successfully deleted' });
};
