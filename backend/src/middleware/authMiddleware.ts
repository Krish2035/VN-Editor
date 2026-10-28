import { Response, NextFunction } from 'express';
import { TracedRequest } from './logger';
import { verifyToken, UserPayload } from '../services/authService';

export interface AuthenticatedRequest extends TracedRequest {
  user?: UserPayload;
  isGuest?: boolean;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required (Bearer <token>)'
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }

  req.user = payload;
  req.isGuest = false;
  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      req.isGuest = false;
      return next();
    }
  }

  // Guest fallback: Attach guest user ID from headers or generate guest session
  const guestHeader = (req.headers['x-guest-id'] as string) || 'guest_default_user';
  req.user = {
    id: guestHeader,
    email: `${guestHeader}@guest.vneditor.local`,
    name: 'Guest Creator',
    role: 'USER'
  };
  req.isGuest = true;
  next();
};
