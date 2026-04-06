const normalize = (value) => (value || "").replace(/\/$/, "");

const isDev = import.meta.env.DEV;
const envApiUrl = normalize(import.meta.env.VITE_API_URL || "");

// In dev, use Vite proxy (/api -> backend/router.php) to avoid browser CORS/network variability.
const defaultApiUrl = "http://localhost/Online-Learning-Platform/backend/api";
export const API_URL = isDev
  ? "/api"
  : normalize(envApiUrl || defaultApiUrl);
export const BACKEND_URL = API_URL.replace(/\/api$/, "");

export const buildAssetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/images/") || path.startsWith("/assets/")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${BACKEND_URL}${path}`;
  }

  return `${BACKEND_URL}/${path}`;
};
