import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as bullQueueService from '../services/bullQueueService';
import * as dbProjectService from '../services/dbProjectService';

export const startRenderJob = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, projectData } = req.body;
  const userId = req.user?.id || 'guest_user';

  let project = projectData;
  if (!project && projectId) {
    project = await dbProjectService.getUserProject(projectId, userId);
  }

  if (!project) {
    return res.status(400).json({
      success: false,
      error: 'Valid project data or existing projectId is required to render'
    });
  }

  const job = await bullQueueService.enqueueRenderJob(project, userId);

  res.status(202).json({
    success: true,
    message: 'Render job queued in distributed processing pipeline',
    data: job
  });
};

export const getRenderJobStatus = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const job = bullQueueService.getJobById(id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Render job not found' });
  }
  res.json({ success: true, data: job });
};

export const listRenderJobs = (req: AuthenticatedRequest, res: Response) => {
  const jobs = bullQueueService.getAllJobs();
  res.json({ success: true, count: jobs.length, data: jobs });
};
