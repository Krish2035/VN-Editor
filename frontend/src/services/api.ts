import { AuthUser, InfrastructureStatus, VNProject } from '../types';

const API_BASE = 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'vn_editor_jwt_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Standard authenticated fetch wrapper
 */
const apiFetch = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set JSON Content-Type only if body is string (not FormData)
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || res.statusText || 'API request failed';
    throw new Error(errorMsg);
  }

  return data;
};

// ==========================================
// 1. Authentication Service
// ==========================================
export const apiRegister = async (payload: {
  email: string;
  password: string;
  name: string;
}): Promise<{ user: AuthUser; token: string }> => {
  const res = await apiFetch<{ success: boolean; data: { user: AuthUser; token: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(res.data.token);
  return res.data;
};

export const apiLogin = async (payload: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> => {
  const res = await apiFetch<{ success: boolean; data: { user: AuthUser; token: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(res.data.token);
  return res.data;
};

export const apiGetMe = async (): Promise<AuthUser | null> => {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await apiFetch<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
    return res.data.user;
  } catch {
    clearStoredToken();
    return null;
  }
};

// ==========================================
// 2. Database Project Service (PostgreSQL / Prisma)
// ==========================================
export const apiListProjects = async (): Promise<VNProject[]> => {
  const res = await apiFetch<{ success: boolean; count: number; data: VNProject[] }>('/projects');
  return res.data || [];
};

export const apiGetProject = async (id: string): Promise<VNProject> => {
  const res = await apiFetch<{ success: boolean; data: VNProject }>(`/projects/${id}`);
  return res.data;
};

export const apiSaveProject = async (project: VNProject): Promise<VNProject> => {
  const res = await apiFetch<{ success: boolean; data: VNProject }>('/projects', {
    method: 'POST',
    body: JSON.stringify({ projectData: project })
  });
  return res.data;
};

export const apiDeleteProject = async (id: string): Promise<void> => {
  await apiFetch(`/projects/${id}`, {
    method: 'DELETE'
  });
};

// ==========================================
// 3. Media Service (Cloud S3 / R2 Presigned Direct Upload)
// ==========================================
export interface PresignUploadResponse {
  assetId: string;
  uploadUrl: string;
  fileUrl: string;
  fields?: Record<string, string>;
  isDirectS3: boolean;
}

export const apiGetPresignedUpload = async (
  filename: string,
  mimeType: string
): Promise<PresignUploadResponse> => {
  const res = await apiFetch<{ success: boolean; data: PresignUploadResponse }>('/media/presign-upload', {
    method: 'POST',
    body: JSON.stringify({ filename, mimeType })
  });
  return res.data;
};

/**
 * Upload file with presigned S3/R2 direct streaming with fallback to multipart API
 */
export const apiUploadMedia = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; assetId?: string; name: string }> => {
  try {
    // 1. Attempt Presigned S3/R2 Direct Upload (Pillars 48, 88)
    const presign = await apiGetPresignedUpload(file.name, file.type);
    if (presign.isDirectS3 && presign.uploadUrl) {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 direct upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('S3 direct upload network error'));
        xhr.open('PUT', presign.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      return {
        url: presign.fileUrl,
        assetId: presign.assetId,
        name: file.name
      };
    }
  } catch (presignErr) {
    console.warn('[Storage] Presign upload unavailable, falling back to server multipart:', presignErr);
  }

  // 2. Fallback to server multipart upload
  const formData = new FormData();
  formData.append('file', file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Media upload failed');

  return {
    url: `http://localhost:5000${data.data.url}`,
    assetId: data.data.id,
    name: file.name
  };
};

// ==========================================
// 4. Infrastructure Health Probes
// ==========================================
export const apiGetHealth = async (): Promise<InfrastructureStatus> => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.infrastructure;
  } catch {
    return {
      database: 'Local File Persistence Adapter',
      jobQueue: 'Resilient In-Memory Worker',
      storage: 'Local Disk Storage'
    };
  }
};
