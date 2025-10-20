// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

// Auth Types
export interface AuthResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  planType: string;
}

export interface User {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'; // Alias for planType
  linkCount: number;
  planLimit: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// Link Types
export interface Link {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  createdAt: string;
  expiresAt?: string;
  maxViews?: number;
  currentViews: number;
  totalClicks: number;
  isActive: boolean;
  expiryType: 'TIME' | 'VIEWS' | 'BOTH' | 'NONE';
  hasPassword: boolean;
  passwordHash?: string; // For checking if password exists
  customMessage?: string;
  expiryPageId?: string;
  status: 'Active' | 'Expired';
}

export interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  expiryType: 'TIME' | 'VIEWS' | 'BOTH' | 'NONE';
  expiresAt?: string;
  maxViews?: number;
  password?: string;
  customMessage?: string;
  expiryPageId?: string;
}

export interface UpdateLinkRequest {
  title?: string;
  originalUrl?: string;
  customMessage?: string;
  isActive?: boolean;
  expiryType?: 'TIME' | 'VIEWS' | 'BOTH' | 'NONE';
  expiresAt?: string;
  maxViews?: number;
  password?: string;
  expiryPageId?: string;
}

export interface PaginatedLinksResponse {
  links: Link[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Analytics Types
export interface DashboardStats {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number;
  totalClicks: number;
  clicksThisMonth: number;
  linksCreatedThisMonth: number;
  linksLimitThisMonth: number;
  topLinks: TopLink[];
  clicksByDate: ClickByDate[];
}

export interface TopLink {
  id: string;
  shortCode: string;
  title?: string;
  totalClicks: number;
}

export interface ClickByDate {
  date: string;
  count: number;
  uniqueVisitors?: number;
}

export interface LinkAnalytics {
  linkId: string;
  shortCode: string;
  title?: string;
  totalClicks: number;
  uniqueVisitors: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  clicksByDate: ClickByDate[];
  clicksByCountry: ClickByCountry[];
  clicksByDevice: ClickByDevice[];
  clicksByBrowser: ClickByBrowser[];
  clicksByReferrer: ClickByReferrer[];
  recentClicks: RecentClick[];
}

export interface ClickByCountry {
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
}

export interface ClickByDevice {
  deviceType: string;
  count: number;
  percentage: number;
}

export interface ClickByBrowser {
  browser: string;
  count: number;
  percentage: number;
}

export interface ClickByReferrer {
  referrer: string;
  count: number;
  percentage: number;
}

export interface RecentClick {
  clickedAt: string;
  countryCode?: string;
  countryName?: string;
  country?: string; // Alias for countryName
  city?: string;
  region?: string;
  deviceType?: string;
  device?: string; // Alias for deviceType
  browser?: string;
  referrer?: string;
}

// Expiry Page Types
export interface ExpiryPage {
  id: string;
  userId: string;
  name: string;
  title: string;
  message?: string;
  logoUrl?: string;
  backgroundColor: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonColor: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialWebsite?: string;
  customCss?: string;
  enableEmailCapture: boolean;
  emailCaptureText?: string;
  createdAt: string;
  updatedAt: string;
  linksUsingCount: number;
  emailsCaptured: number;
}

export interface CreateExpiryPageRequest {
  name: string;
  title: string;
  message?: string;
  logoUrl?: string;
  backgroundColor?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonColor?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialWebsite?: string;
  customCss?: string;
  enableEmailCapture?: boolean;
  emailCaptureText?: string;
}

export interface UpdateExpiryPageRequest {
  name?: string;
  title?: string;
  message?: string;
  logoUrl?: string;
  backgroundColor?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonColor?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialWebsite?: string;
  customCss?: string;
  enableEmailCapture?: boolean;
  emailCaptureText?: string;
}

export interface CaptureEmailRequest {
  email: string;
}

export interface CaptureEmailResponse {
  success: boolean;
  message: string;
}

export interface ExpiryPageEmail {
  id: string;
  expiryPageId: string;
  linkId?: string;
  email: string;
  capturedAt: string;
  ipHash?: string;
  userAgent?: string;
}
