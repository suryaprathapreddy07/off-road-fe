"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from cookies on mount
  useEffect(() => {
    const storedToken = Cookies.get("token");
    const storedUser = Cookies.get("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        Cookies.remove("token");
        Cookies.remove("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/login", { email, password });

      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      // Store in cookies
      Cookies.set("token", newToken, { expires: 7 }); // 7 days
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });

      toast.success("Login successful!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: "user" | "admin";
  }) => {
    try {
      setIsLoading(true);
      const response = await api.post("/auth/register", userData);

      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      // Store in cookies
      Cookies.set("token", newToken, { expires: 7 });
      Cookies.set("user", JSON.stringify(newUser), { expires: 7 });

      toast.success("Registration successful!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove("token");
    Cookies.remove("user");
    toast.success("Logged out successfully");
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
