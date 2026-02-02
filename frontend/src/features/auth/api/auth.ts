import { apiClient } from "@/shared/api";
import { User } from "@/entities/user";

const AUTH_FLAG_KEY = "toki-authenticated";

export interface AuthCredentials {
  phone: string;
  password: string;
  username?: string;
}

export async function register({ phone, password, username }: AuthCredentials): Promise<{ message: string; user: User }> {
  const response = await apiClient.post("/api/auth/register", {
    phone,
    password,
    username,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_FLAG_KEY, "true");
  }

  return response.data;
}

export async function login({ phone, password }: AuthCredentials): Promise<{ message: string; user: User }> {
  const response = await apiClient.post("/api/auth/login", {
    phone,
    password,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_FLAG_KEY, "true");
  }

  return response.data;
}

export async function logout(): Promise<{ message: string }> {
  const response = await apiClient.post("/api/auth/logout");

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_FLAG_KEY);
  }

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get("/api/auth/me");

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_FLAG_KEY, "true");
  }

  return response.data;
}

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_FLAG_KEY) === "true";
}
