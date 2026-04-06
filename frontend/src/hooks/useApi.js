import { useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

const normalizeBase = (value) => (value || "").replace(/\/$/, "");

const getApiFallbackBases = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const envBase = normalizeBase(import.meta.env.VITE_API_URL || "");

  const bases = [
    normalizeBase(API_URL),
    envBase,
    `${origin}/Online-Learning-Platform/backend/api`,
    `${origin}/backend/api`,
    "http://localhost/Online-Learning-Platform/backend/api",
    "http://localhost/backend/api"
  ].filter(Boolean);

  return Array.from(new Set(bases));
};

const buildRouterFallbackUrl = (requestUrl) => {
  if (!requestUrl) {
    return null;
  }

  let rawUrl = String(requestUrl);
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const parsed = new URL(rawUrl);
      rawUrl = `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }

  if (!rawUrl.startsWith("/")) {
    rawUrl = `/${rawUrl}`;
  }

  const [pathPart, queryPart = ""] = rawUrl.split("?");
  const cleanPath = pathPart.replace(/^\/+/, "");
  if (!cleanPath) {
    return null;
  }

  const envBase = normalizeBase(import.meta.env.VITE_API_URL || "");
  const routerCandidates = [
    envBase ? envBase.replace(/\/api$/i, "/router.php") : "",
    "http://localhost/Online-Learning-Platform/backend/router.php",
    "http://localhost/backend/router.php"
  ].filter(Boolean);

  const routerBase = routerCandidates[0];
  const rewritten = `${routerBase}?path=${encodeURIComponent(cleanPath)}`;
  return queryPart ? `${rewritten}&${queryPart}` : rewritten;
};

const shouldRetry404WithFallback = (error, originalRequest) => {
  const status = error?.response?.status;
  if (status !== 404) {
    return false;
  }
  if (!originalRequest) {
    return false;
  }
  if (originalRequest._fallbackRetried) {
    return false;
  }
  const url = String(originalRequest.url || "");
  return url.startsWith("/") || url.startsWith("http");
};

const useApi = () => {
  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: false,
      timeout: 15000
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      config.headers = config.headers || {};
      config.headers["Cache-Control"] = "no-cache";
      config.headers.Pragma = "no-cache";

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const method = String(config.method || "get").toLowerCase();
      if (method === "get") {
        config.params = config.params || {};
        if (!Object.prototype.hasOwnProperty.call(config.params, "_ts")) {
          config.params._ts = Date.now();
        }
      }

      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;
        const status = error?.response?.status;

        if (shouldRetry404WithFallback(error, originalRequest)) {
          const fallbackBases = getApiFallbackBases();
          const currentBase = normalizeBase(originalRequest?.baseURL || API_URL);
          const nextBase = fallbackBases.find((base) => normalizeBase(base) !== currentBase);

          if (nextBase) {
            originalRequest._fallbackRetried = true;
            return axios({
              ...originalRequest,
              baseURL: nextBase
            });
          }

          if (!originalRequest._routerFallbackRetried) {
            const routerUrl = buildRouterFallbackUrl(originalRequest?.url);
            if (routerUrl) {
              originalRequest._routerFallbackRetried = true;
              originalRequest._fallbackRetried = true;
              return axios({
                ...originalRequest,
                baseURL: undefined,
                url: routerUrl
              });
            }
          }
        }

        if (!originalRequest || status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });
          const newToken = refreshResponse?.data?.token || refreshResponse?.data?.accessToken;
          const newRefreshToken = refreshResponse?.data?.refreshToken;

          if (!newToken) {
            return Promise.reject(error);
          }

          localStorage.setItem("token", newToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return Promise.reject(refreshError);
        }
      }
    );

    return instance;
  }, []);

  return client;
};

export default useApi;
