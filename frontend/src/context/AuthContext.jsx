import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const resetAuthState = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const response = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const meUser = response?.data?.user || null;
      const mePermissions = response?.data?.permissions || [];
      if (!meUser) {
        resetAuthState();
        return;
      }

      setUser(meUser);
      setPermissions(Array.isArray(mePermissions) ? mePermissions : []);
      setIsAuthenticated(true);
    } catch {
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [api, resetAuthState]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(async (email, password, selectedRole) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password, role: selectedRole });
      const token = response?.data?.token || response?.data?.accessToken;
      const refreshToken = response?.data?.refreshToken;
      const loggedUser = response?.data?.user;

      if (!token || !loggedUser) {
        throw new Error("Invalid login response.");
      }

      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      setUser(loggedUser);
      setIsAuthenticated(true);

      const role = loggedUser?.role || "student";
      const redirectPath = role === "admin"
        ? "/admin/dashboard"
        : role === "instructor"
          ? "/instructor/dashboard"
          : "/";

      return { success: true, redirectPath };
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {
        refreshToken: localStorage.getItem("refreshToken"),
        logoutAll: false
      });
    } catch {
      // Ignore logout API errors and clear local auth state anyway.
    } finally {
      resetAuthState();
    }

    return { success: true };
  }, [api, resetAuthState]);

  const updateProfile = useCallback(async (profileData) => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await api.put("/users/profile", profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = response?.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
      }

      return { success: true, user: updatedUser };
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update profile.";
      setError(message);
      return { success: false, error: message };
    }
  }, [api]);

  const value = useMemo(() => ({
    user,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
    hasPermission: (permission) => (user?.role === "admin" ? true : permissions.includes(permission) || permissions.includes("*")),
    clearError: () => setError(null)
  }), [user, permissions, isAuthenticated, isLoading, error, login, logout, updateProfile, checkAuthStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
