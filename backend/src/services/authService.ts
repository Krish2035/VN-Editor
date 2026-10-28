import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma, isDatabaseConnected } from '../config/db';
import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './storageService';

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'vn_editor_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'PRO_CREATOR' | 'ADMIN';
}

// Local filesystem fallback storage
const getLocalUsers = (): any[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf-8');
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: any[]) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

export const registerUser = async (email: string, password: string, name: string) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('User with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = `usr_${uuidv4().substring(0, 10)}`;

  if (isDatabaseConnected) {
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'USER'
      }
    });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: generateToken({ id: user.id, email: user.email, name: user.name, role: user.role })
    };
  }

  // Local fallback persistence
  const newUser = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: 'USER' as const,
    createdAt: new Date().toISOString()
  };

  const users = getLocalUsers();
  users.push(newUser);
  saveLocalUsers(users);

  return {
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    token: generateToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role })
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return {
    user: payload,
    token: generateToken(payload)
  };
};

export const findUserByEmail = async (email: string) => {
  const normalized = email.toLowerCase();
  if (isDatabaseConnected) {
    return await prisma.user.findUnique({ where: { email: normalized } });
  }
  const users = getLocalUsers();
  return users.find((u) => u.email === normalized) || null;
};

export const findUserById = async (id: string) => {
  if (isDatabaseConnected) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  }
  const users = getLocalUsers();
  const u = users.find((item) => item.id === id);
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
};

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
};
