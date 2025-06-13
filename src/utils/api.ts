import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to include the auth token in all requests
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  }
  return config;
});

// Products API
export const getProducts = async (category?: string, query?: string) => {
  let url = '/products';
  const params = new URLSearchParams();
  
  if (category) params.append('category', category);
  if (query) params.append('query', query);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await API.get(url);
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

// Auth API
export const register = async (userData: { name: string; email: string; password: string }) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials: { email: string; password: string }) => {
  const response = await API.post('/auth/login', credentials);
  
  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  }
};

// Orders API
export const getOrders = async () => {
  const response = await API.get('/orders');
  return response.data;
};

export const createOrder = async (orderData: {
  items: Array<{ productId: string; quantity: number; price: number }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalAmount: number;
}) => {
  const response = await API.post('/orders', orderData);
  return response.data;
};

// Auth helper
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
  return !!localStorage.getItem('token');
  }
  return false;
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
  }
  return null;
};
