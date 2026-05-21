import axios from 'axios';

// guige.host tRPC API 基础URL
const GUIGE_API_BASE = '';  // 空字符串表示同源，使用当前域名

// tRPC 请求封装
async function trpcRequest<T>(procedure: string, params?: any): Promise<T> {
  const response = await axios.post(`${GUIGE_API_BASE}/api/trpc/${procedure}`, {
    json: params
  }, {
    withCredentials: true,  // 发送 session cookie
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = response.data;
  if (data.error) {
    throw new Error(data.error.json?.message || 'API 请求失败');
  }
  return data.result?.data as T;
}

// 认证相关 API
export const authApi = {
  // 获取当前登录用户
  me: () => trpcRequest<any>('auth.me'),

  // 获取兔点余额
  getBalance: () => trpcRequest<{ tuPoints: number }>('auth.getBalance'),

  // 扣除兔点
  consumePoints: (amount: number, toolSlug: string, description: string) =>
    trpcRequest<{ success: boolean; newBalance: number }>('auth.consumePoints', {
      amount,
      toolSlug,
      description
    }),

  // 获取兔点日志
  getPointLogs: () => trpcRequest<any[]>('auth.getPointLogs'),
};

// 兔填填后端 API 客户端 - 带 cookie 和用户ID
const tutiantianClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  withCredentials: true,
});

// 请求拦截器 - 添加用户ID
tutiantianClient.interceptors.request.use(
  (config) => {
    // 动态导入避免循环依赖
    const { useAuthStore } = require('../stores/authStore');
    const user = useAuthStore.getState().user;
    if (user?.id) {
      config.headers['X-User-Id'] = String(user.id);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
tutiantianClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 套餐 API
export const packageApi = {
  list: () => tutiantianClient.get('/packages'),
  get: (id: number) => tutiantianClient.get(`/packages/${id}`),
};

// 订单 API (使用 guige.host 充值)
export const orderApi = {
  create: async (packageId: number) => {
    const result = await trpcRequest<any>('auth.createRechargeOrder', { packageId });
    return { data: result };
  },
  get: (orderNo: string) => tutiantianClient.get(`/orders/${orderNo}`),
  list: () => tutiantianClient.get('/orders'),
  delete: (orderNo: string) => tutiantianClient.delete(`/orders/${orderNo}`),
  confirm: (orderNo: string) => tutiantianClient.post(`/orders/${orderNo}/confirm`),
};

// 使用记录 API
export const usageLogApi = {
  list: () => tutiantianClient.get('/usage-logs'),
};

// 模板 API
export const templateApi = {
  list: () => tutiantianClient.get('/templates'),
  listMarked: () => tutiantianClient.get('/templates/marked'),
  upload: (formData: FormData) => tutiantianClient.post('/templates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  get: (id: number) => tutiantianClient.get(`/templates/${id}`),
  delete: (id: number) => tutiantianClient.delete(`/templates/${id}`),
  markField: (templateId: number, originalText: string, fieldName: string, format?: any) => {
    const formData = new FormData();
    formData.append('template_id', String(templateId));
    formData.append('original_text', originalText);
    formData.append('field_name', fieldName);
    formData.append('font_name', format?.fontName || '宋体');
    formData.append('font_size', format?.fontSize || '五号');
    formData.append('bold', format?.bold ? '1' : '0');
    formData.append('italic', format?.italic ? '1' : '0');
    formData.append('color', format?.color || '#000000');
    formData.append('alignment', format?.alignment || 'left');
    return tutiantianClient.post('/templates/mark-field', formData);
  },
  insertField: (templateId: number, fieldName: string, position?: string, tableIndex?: number, row?: number, col?: number, format?: any) => {
    const formData = new FormData();
    formData.append('template_id', String(templateId));
    formData.append('field_name', fieldName);
    formData.append('position', position || 'end');
    formData.append('font_name', format?.fontName || '宋体');
    formData.append('font_size', format?.fontSize || '五号');
    formData.append('bold', format?.bold ? '1' : '0');
    formData.append('italic', format?.italic ? '1' : '0');
    formData.append('color', format?.color || '#000000');
    formData.append('alignment', format?.alignment || 'left');
    if (tableIndex !== undefined) formData.append('table_index', String(tableIndex));
    if (row !== undefined) formData.append('row', String(row));
    if (col !== undefined) formData.append('col', String(col));
    return tutiantianClient.post('/templates/insert-field', formData);
  },
  getFields: (templateId: number) => tutiantianClient.get(`/templates/fields/${templateId}`),
  deleteField: (fieldId: number) => tutiantianClient.delete(`/templates/fields/${fieldId}`),
  saveTemplate: (templateId: number, templateName: string) => {
    const params = new URLSearchParams();
    params.append('template_id', String(templateId));
    params.append('template_name', templateName);
    return tutiantianClient.post('/templates/save-template', null, { params });
  },
  downloadMarked: (templateId: number) =>
    tutiantianClient.get(`/templates/download/${templateId}`, { responseType: 'blob' }),
};

// 数据源 API
export const datasourceApi = {
  list: () => tutiantianClient.get('/datasources'),
  get: (id: number) => tutiantianClient.get(`/datasources/${id}`),
  upload: (formData: FormData) => tutiantianClient.post('/datasources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => tutiantianClient.delete(`/datasources/${id}`),
};

// 项目 API
export const projectApi = {
  list: () => tutiantianClient.get('/projects'),
  create: (data: any) => tutiantianClient.post('/projects', data),
  get: (id: number) => tutiantianClient.get(`/projects/${id}`),
  autoMap: (id: number, threshold: number) => tutiantianClient.post(`/projects/${id}/auto-map`, { threshold }),
  updateMappings: (id: number, mappings: any[]) => tutiantianClient.put(`/projects/${id}/mappings`, mappings),
  preview: (id: number, rowIndex: number) => tutiantianClient.get(`/projects/${id}/preview?row_index=${rowIndex}`, {
    responseType: 'blob'
  }),
};

// 任务 API
export const taskApi = {
  list: () => tutiantianClient.get('/tasks'),
  generate: (projectId: number, data: any) => tutiantianClient.post(`/tasks/${projectId}/generate`, data),
  status: (taskId: string) => tutiantianClient.get(`/tasks/${taskId}`),
  download: (taskId: string) => tutiantianClient.get(`/tasks/${taskId}/download`, { responseType: 'blob' }),
};

export default {
  authApi,
  packageApi,
  orderApi,
  usageLogApi,
  templateApi,
  datasourceApi,
  projectApi,
  taskApi,
};
