import axios from "axios";

// Get the base URL from environment or use window.location.origin in the browser
const baseURL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api`
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api');

// Add request interceptor to include token
export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending cookies
});

// Helper to safely get token on client side
const getClientToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith('token='));
  if (!tokenCookie) return null;
  try {
    return decodeURIComponent(tokenCookie.split('=')[1].trim());
  } catch {
    return tokenCookie.split('=')[1].trim();
  }
};

// Add request interceptor to include token from cookie
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = getClientToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const fetchData = {
  get: async (url: string, params = {}) => {
    try {
      const token = getClientToken();
      const config = {
        params,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      };

      console.log('Making GET request with config:', { url, config });
      const response = await axiosInstance.get(url, config);
      return response;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },
  post: async (url: string, data = {}) => {
    try {
      const token = getClientToken();
      const config = {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      };

      console.log('Making POST request with config:', { url, data, config });
      const response = await axiosInstance.post(url, data, config);
      return response;
    } catch (error) {
      console.error("Error posting data:", error);
      throw error;
    }
  },
};

export default fetchData;
