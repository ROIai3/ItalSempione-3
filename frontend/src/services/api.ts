import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export async function login(username: string, password: string) {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getBatches(page = 1, limit = 20) {
  const { data } = await api.get('/upload/batches', { params: { page, limit } });
  return data;
}

export async function getBatchDetail(id: string) {
  const { data } = await api.get(`/upload/batches/${id}`);
  return data.data;
}

export async function getShipments(params: {
  page?: number;
  limit?: number;
  is_active?: boolean;
  carrier?: string;
  status?: string;
} = {}) {
  const { data } = await api.get('/shipments', { params });
  return data;
}

export async function getShipment(id: string) {
  const { data } = await api.get(`/shipments/${id}`);
  return data.data;
}

export async function updateShipment(id: string, updates: Record<string, unknown>) {
  const { data } = await api.patch(`/shipments/${id}`, updates);
  return data.data;
}

export async function triggerTracking(shipmentId: string) {
  const { data } = await api.post('/tracking/execute', { shipment_id: shipmentId });
  return data;
}

export async function getTrackingLog(shipmentId: string, limit = 50, offset = 0) {
  const { data } = await api.get(`/tracking/shipments/${shipmentId}/log`, {
    params: { limit, offset },
  });
  return data.data;
}

export async function getEtaHistory(shipmentId: string) {
  const { data } = await api.get(`/tracking/shipments/${shipmentId}/eta-history`);
  return data.data;
}

export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/stats');
  return data.data;
}

export async function deleteShipment(id: string) {
  const { data } = await api.delete(`/shipments/${id}`);
  return data;
}

export async function deleteBulkShipments(ids: string[]) {
  const { data } = await api.post('/shipments/delete-bulk', { ids });
  return data;
}

export async function resetSystem() {
  const { data } = await api.post('/dashboard/reset');
  return data;
}
