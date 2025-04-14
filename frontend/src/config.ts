// Determine if we're running in development mode (npm run dev)
const isDevelopment = import.meta.env.DEV;

// Set the backend API URL
// Priority: 
// 1. Use localhost for dev mode
// 2. Use environment variable from Docker (.env.production)
// 3. Fallback to current browser IP for Docker users who didn't set env var
export const API_URL = isDevelopment
  ? 'http://localhost:8175'
  : import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8175`;
