import { apiRequest, clearAuthToken, setAuthToken } from "./api";
import { AuthResponse, User } from "../types/auth";

export const authService = {
  async register(email: string, password: string) {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: { email, password }
    });
    setAuthToken(response.token);
    return response;
  },

  async login(email: string, password: string) {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    setAuthToken(response.token);
    return response;
  },

  async me() {
    return apiRequest<User>("/auth/me");
  },

  logout() {
    clearAuthToken();
  }
};
