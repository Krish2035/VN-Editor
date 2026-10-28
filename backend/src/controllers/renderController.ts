import { Response } from 'express';
import { TracedRequest } from '../middleware/logger';
import * as renderQueue from '../services/renderQueue';
import * as projectService from '../services/projectService';

export const startRenderJob = (req: TracedRequest, res: Response) => {
  const { projectId, projectData } = req.body;

  let project = projectData;
  if (!project && projectId) {
    project = projectService.getProjectById(projectId);
  }

  if (!project) {
    return res.status(400).json({
      success: false,
      error: 'Valid project data or existing projectId is required to render'
    });
  }

  const job = renderQueue.createRenderJob(project);

  res.status(202).json({
    success: true,
    message: 'Render job queued successfully',
    data: job
  });
};

export const getRenderJobStatus = (req: TracedRequest, res: Response) => {
  const { id } = req.params;
  const job = renderQueue.getJobById(id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Render job not found' });
  }
  res.json({ success: true, data: job });
};

export const listRenderJobs = (req: TracedRequest, res: Response) => {
  const jobs = renderQueue.getAllJobs();
  res.json({ success: true, count: jobs.length, data: jobs });
};
