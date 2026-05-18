import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

// 请求拦截器 - 添加Token
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// 套餐API
export const packageApi = {
  list: () => client.get('/packages'),
  get: (id: number) => client.get(`/packages/${id}`),
};

// 订单API
export const orderApi = {
  create: (packageId: number) => client.post('/orders/create', { package_id: packageId, payment_method: 'wechat' }),
  get: (orderNo: string) => client.get(`/orders/${orderNo}`),
  list: () => client.get('/orders'),
  delete: (orderNo: string) => client.delete(`/orders/${orderNo}`),
  confirm: (orderNo: string) => client.post(`/orders/${orderNo}/confirm`),
};

// 使用记录API
export const usageLogApi = {
  list: () => client.get('/usage-logs'),
};

// 模板API
export const templateApi = {
  list: () => client.get('/templates'),
  listMarked: () => client.get('/templates/marked'),
  upload: (formData: FormData) => client.post('/templates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  get: (id: number) => client.get(`/templates/${id}`),
  delete: (id: number) => client.delete(`/templates/${id}`),
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
    return client.post('/templates/mark-field', formData);
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
    return client.post('/templates/insert-field', formData);
  },
  getFields: (templateId: number) => client.get(`/templates/fields/${templateId}`),
  deleteField: (fieldId: number) => client.delete(`/templates/fields/${fieldId}`),
  saveTemplate: (templateId: number, templateName: string) => {
    const params = new URLSearchParams();
    params.append('template_id', String(templateId));
    params.append('template_name', templateName);
    return client.post('/templates/save-template', null, { params });
  },
  downloadMarked: (templateId: number) =>
    client.get(`/templates/download/${templateId}`, { responseType: 'blob' }),
};

// 数据源API
export const datasourceApi = {
  list: () => client.get('/datasources'),
  get: (id: number) => client.get(`/datasources/${id}`),
  upload: (formData: FormData) => client.post('/datasources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => client.delete(`/datasources/${id}`),
};

// 项目API
export const projectApi = {
  list: () => client.get('/projects'),
  create: (data: any) => client.post('/projects', data),
  get: (id: number) => client.get(`/projects/${id}`),
  autoMap: (id: number, threshold: number) => client.post(`/projects/${id}/auto-map`, { threshold }),
  updateMappings: (id: number, mappings: any[]) => client.put(`/projects/${id}/mappings`, mappings),
  preview: (id: number, rowIndex: number) => client.get(`/projects/${id}/preview?row_index=${rowIndex}`, {
    responseType: 'blob'
  }),
};

// 任务API
export const taskApi = {
  list: () => client.get('/tasks'),
  generate: (projectId: number, data: any) => client.post(`/tasks/${projectId}/generate`, data),
  status: (taskId: string) => client.get(`/tasks/${taskId}`),
  download: (taskId: string) => client.get(`/tasks/${taskId}/download`, { responseType: 'blob' }),
};

export default client;
