import { ContactInfo, GroupChat, MediaPlatform, Project } from '@/lib/info-management-schema';

const API_BASE = '/api/info-management';

// 联系方式API
export const contactInfoApi = {
  // 获取所有联系方式
  getAll: async (): Promise<ContactInfo[]> => {
    const response = await fetch(`${API_BASE}/contact-info`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取联系方式失败');
    }
    return data.data;
  },

  // 获取特定联系方式
  getById: async (id: number): Promise<ContactInfo> => {
    const response = await fetch(`${API_BASE}/contact-info/${id}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取联系方式失败');
    }
    return data.data;
  },

  // 创建联系方式
  create: async (contact: Omit<ContactInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactInfo> => {
    const response = await fetch(`${API_BASE}/contact-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '创建联系方式失败');
    }
    return data.data;
  },

  // 更新联系方式
  update: async (id: number, contact: Partial<ContactInfo>): Promise<ContactInfo> => {
    const response = await fetch(`${API_BASE}/contact-info/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '更新联系方式失败');
    }
    return data.data;
  },

  // 删除联系方式
  delete: async (id: number): Promise<ContactInfo> => {
    const response = await fetch(`${API_BASE}/contact-info/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '删除联系方式失败');
    }
    return data.data;
  },
};

// 群聊API
export const groupChatsApi = {
  // 获取所有群聊
  getAll: async (): Promise<GroupChat[]> => {
    const response = await fetch(`${API_BASE}/group-chats`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取群聊列表失败');
    }
    return data.data;
  },

  // 获取特定群聊
  getById: async (id: number): Promise<GroupChat> => {
    const response = await fetch(`${API_BASE}/group-chats/${id}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取群聊失败');
    }
    return data.data;
  },

  // 创建群聊
  create: async (group: Omit<GroupChat, 'id' | 'createdAt' | 'updatedAt'>): Promise<GroupChat> => {
    const response = await fetch(`${API_BASE}/group-chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '创建群聊失败');
    }
    return data.data;
  },

  // 更新群聊
  update: async (id: number, group: Partial<GroupChat>): Promise<GroupChat> => {
    const response = await fetch(`${API_BASE}/group-chats/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '更新群聊失败');
    }
    return data.data;
  },

  // 删除群聊
  delete: async (id: number): Promise<GroupChat> => {
    const response = await fetch(`${API_BASE}/group-chats/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '删除群聊失败');
    }
    return data.data;
  },
};

// 媒体平台API
export const mediaPlatformsApi = {
  // 获取所有媒体平台
  getAll: async (): Promise<MediaPlatform[]> => {
    const response = await fetch(`${API_BASE}/media-platforms`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取媒体平台失败');
    }
    return data.data;
  },

  // 获取特定媒体平台
  getById: async (id: string): Promise<MediaPlatform> => {
    const response = await fetch(`${API_BASE}/media-platforms/${id}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取媒体平台失败');
    }
    return data.data;
  },

  // 创建媒体平台
  create: async (platform: Omit<MediaPlatform, 'createdAt' | 'updatedAt'>): Promise<MediaPlatform> => {
    const response = await fetch(`${API_BASE}/media-platforms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(platform),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '创建媒体平台失败');
    }
    return data.data;
  },

  // 更新媒体平台
  update: async (id: string, platform: Partial<MediaPlatform>): Promise<MediaPlatform> => {
    const response = await fetch(`${API_BASE}/media-platforms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(platform),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '更新媒体平台失败');
    }
    return data.data;
  },

  // 删除媒体平台
  delete: async (id: string): Promise<MediaPlatform> => {
    const response = await fetch(`${API_BASE}/media-platforms/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '删除媒体平台失败');
    }
    return data.data;
  },
};

// 项目API
export const projectsApi = {
  // 获取所有项目
  getAll: async (): Promise<Project[]> => {
    const response = await fetch(`${API_BASE}/projects`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取项目列表失败');
    }
    return data.data;
  },

  // 获取特定项目
  getById: async (id: number): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '获取项目失败');
    }
    return data.data;
  },

  // 创建项目
  create: async (project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '创建项目失败');
    }
    return data.data;
  },

  // 更新项目
  update: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '更新项目失败');
    }
    return data.data;
  },

  // 删除项目
  delete: async (id: number): Promise<Project> => {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || '删除项目失败');
    }
    return data.data;
  },
};
