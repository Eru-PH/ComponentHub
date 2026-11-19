import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Login endpoints
export const loginUser = (credentials) => api.post('/api/login', credentials);

// Inventory endpoints
export const getComponents = () => api.get('/api/components');
export const addComponent = (componentData) => api.post('/api/components', componentData);

// Borrow & return endpoints
export const borrowComponent = (borrowData) => api.post('/api/borrow', borrowData);
export const getBorrowLogs = () => api.get('/api/borrow-logs');
export const returnComponent = (logId) => api.patch(`/api/return/${logId}`);

// CSV export
export const getExportLogsUrl = () => `${api.defaults.baseURL}/api/logs/export`;

export default api;