import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateLinkRequest,
  UpdateLinkRequest,
  Link,
  PaginatedLinksResponse,
  DashboardStats,
  LinkAnalytics,
  ExpiryPage,
  CreateExpiryPageRequest,
  UpdateExpiryPageRequest,
  ExpiryPageEmail,
  CaptureEmailRequest,
  CaptureEmailResponse,
} from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:34049";

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // For httpOnly cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear auth and redirect to login
            this.clearAuth();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private setAccessToken(token: string): void {
    localStorage.setItem("accessToken", token);
  }

  private clearAuth(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post<ApiResponse<AuthResponse>>(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;
          this.setAccessToken(accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
          return accessToken;
        }

        throw new Error("Token refresh failed");
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      "/api/auth/register",
      data
    );
    if (response.data.success && response.data.data) {
      const authData = response.data.data;
      this.setAccessToken(authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: authData.userId,
          email: authData.email,
          planType: authData.planType,
        })
      );
      return authData;
    }
    throw new Error(response.data.message || "Registration failed");
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      "/api/auth/login",
      data
    );
    if (response.data.success && response.data.data) {
      const authData = response.data.data;
      this.setAccessToken(authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: authData.userId,
          email: authData.email,
          planType: authData.planType,
        })
      );
      return authData;
    }
    throw new Error(response.data.message || "Login failed");
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/api/auth/logout");
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.client.get<ApiResponse>("/api/auth/me");
    return response.data.data;
  }

  // Link endpoints
  async createLink(data: CreateLinkRequest): Promise<Link> {
    const response = await this.client.post<ApiResponse<Link>>(
      "/api/links",
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create link");
  }

  async getLinks(
    pageNumber: number = 1,
    pageSize: number = 10,
    activeOnly?: boolean
  ): Promise<PaginatedLinksResponse> {
    const params: any = { pageNumber, pageSize };
    if (activeOnly !== undefined) {
      params.activeOnly = activeOnly;
    }
    const response = await this.client.get<ApiResponse<PaginatedLinksResponse>>(
      "/api/links",
      { params }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch links");
  }

  async getLink(id: string): Promise<Link> {
    const response = await this.client.get<ApiResponse<Link>>(
      `/api/links/${id}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch link");
  }

  async updateLink(id: string, data: UpdateLinkRequest): Promise<Link> {
    const response = await this.client.put<ApiResponse<Link>>(
      `/api/links/${id}`,
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to update link");
  }

  async deleteLink(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/links/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete link");
    }
  }

  async getUsage(): Promise<{
    linksCreatedThisMonth: number;
    canCreateMore: boolean;
  }> {
    const response = await this.client.get<ApiResponse<any>>(
      "/api/links/usage"
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch usage");
  }

  // Analytics endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<ApiResponse<DashboardStats>>(
      "/api/analytics/dashboard"
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch dashboard stats");
  }

  async getLinkAnalytics(
    linkId: string,
    days: number = 30
  ): Promise<LinkAnalytics> {
    const response = await this.client.get<ApiResponse<LinkAnalytics>>(
      `/api/analytics/links/${linkId}`,
      { params: { days } }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch link analytics");
  }

  // User endpoints
  async updateProfile(data: { firstName: string; lastName: string; email: string; phone: string }): Promise<void> {
    const response = await this.client.put<ApiResponse>(
      "/api/auth/profile",
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update profile");
    }
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const response = await this.client.put<ApiResponse>(
      "/api/user/password",
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to change password");
    }
  }

  // Expiry Page endpoints
  async getExpiryPages(): Promise<ExpiryPage[]> {
    const response = await this.client.get<ApiResponse<ExpiryPage[]>>(
      "/api/expirypage"
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch expiry pages");
  }

  async getExpiryPage(id: string): Promise<ExpiryPage> {
    const response = await this.client.get<ApiResponse<ExpiryPage>>(
      `/api/expirypage/${id}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch expiry page");
  }

  async createExpiryPage(data: CreateExpiryPageRequest): Promise<ExpiryPage> {
    const response = await this.client.post<ApiResponse<ExpiryPage>>(
      "/api/expirypage",
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to create expiry page");
  }

  async updateExpiryPage(
    id: string,
    data: UpdateExpiryPageRequest
  ): Promise<ExpiryPage> {
    const response = await this.client.put<ApiResponse<ExpiryPage>>(
      `/api/expirypage/${id}`,
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to update expiry page");
  }

  async deleteExpiryPage(id: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(
      `/api/expirypage/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete expiry page");
    }
  }

  async getExpiryPageEmails(id: string): Promise<ExpiryPageEmail[]> {
    const response = await this.client.get<ApiResponse<ExpiryPageEmail[]>>(
      `/api/expirypage/${id}/emails`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data.message || "Failed to fetch captured emails"
    );
  }

  async captureEmail(
    id: string,
    data: CaptureEmailRequest
  ): Promise<CaptureEmailResponse> {
    const response = await this.client.post<ApiResponse<CaptureEmailResponse>>(
      `/api/expirypage/${id}/capture-email`,
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to capture email");
  }
}

export const api = new ApiClient();
