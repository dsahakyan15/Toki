import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests (HttpOnly cookie auth)
});

// Handle auth errors (401 = unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // User is not authenticated or session expired
      // You can add redirect logic here if needed
      console.warn('Authentication required. Please log in.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
