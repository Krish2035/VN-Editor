import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as authService from '../services/authService';

export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    const result = await authService.registerUser(email, password, name);
    res.status(201).json({
      success: true,
      message: 'Account successfully registered',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);
    res.json({
      success: true,
      message: 'Authentication successful',
      data: result
    });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const user = await authService.findUserById(req.user.id);
  res.json({ success: true, data: user || req.user });
};
