import { FamilyMember } from "@/components/admin/MemberNode";
import {
  IMAGEKIT_CONFIG,
  ImageKitUploadResponse,
  ImageKitAuthParams,
} from "./imagekit-config";

// API base URL with the /api prefix added when needed
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("francis_legacy_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure endpoint starts with /api
    const apiEndpoint = endpoint.startsWith("/api")
      ? endpoint
      : `/api${endpoint}`;
    const url = `${this.baseURL}${apiEndpoint}`;

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only add Content-Type for requests with body
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    // Configure caching for GET requests
    const cacheConfig: RequestCache =
      options.method === "GET" ? "default" : "no-store";

    const config: RequestInit = {
      ...options,
      headers,
      cache: cacheConfig,
      // Add credentials to ensure cookies are sent with the request
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${apiEndpoint}:`, error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "admin" | "member";
      };
      message: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem("francis_legacy_token", response.token);
    localStorage.setItem("francis_legacy_user", JSON.stringify(response.user));

    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.request<{
      token: string;
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "admin" | "member";
      };
      message: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    this.token = response.token;
    localStorage.setItem("francis_legacy_token", response.token);
    localStorage.setItem("francis_legacy_user", JSON.stringify(response.user));

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("francis_legacy_token");
    localStorage.removeItem("francis_legacy_user");
  }

  // Family methods
  async getFamilyMembers() {
    return this.request<FamilyMember[]>("/family", {
      method: "GET",
    });
  }

  async getFamilyMember(id: string) {
    return this.request<FamilyMember>(`/family/${id}`, {
      method: "GET",
    });
  }

  async createFamilyMember(memberData: FamilyMember) {
    return this.request<FamilyMember>("/family", {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  }

  async updateFamilyMember(id: string, memberData: FamilyMember) {
    return this.request<FamilyMember>(`/family/${id}`, {
      method: "PUT",
      body: JSON.stringify(memberData),
    });
  }

  async deleteFamilyMember(id: string) {
    return this.request<{ message: string }>(`/family/${id}`, {
      method: "DELETE",
    });
  }

  // Blog methods
  async getBlogPosts() {
    return this.request<
      {
        id: string;
        title: string;
        slug: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[]
    >("/blog", {
      method: "GET",
    });
  }

  async getBlogPost(slug: string) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/blog/${slug}`, {
      method: "GET",
    });
  }

  async createBlogPost(postData: {
    title: string;
    slug: string;
    content: string;
  }) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>("/blog", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async updateBlogPost(
    id: string,
    postData: {
      title: string;
      slug: string;
      content: string;
    }
  ) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request<{ message: string }>(`/blog/${id}`, {
      method: "DELETE",
    });
  }

  // ImageKit upload methods
  async uploadFile(file: File, folder: string = "archives") {
    try {
      // Step 1: Get authentication parameters from backend
      const authResponse = await this.request<ImageKitAuthParams>(
        "/upload/auth"
      );

      // Step 2: Upload directly to ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicKey", IMAGEKIT_CONFIG.publicKey);
      formData.append("signature", authResponse.signature);
      formData.append("expire", authResponse.expire.toString());
      formData.append("token", authResponse.token);
      formData.append("fileName", file.name);
      formData.append("folder", `/${folder}`);
      formData.append("useUniqueFileName", "true");

      const response = await fetch(IMAGEKIT_CONFIG.uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("ImageKit upload failed:", errorData);
        throw new Error(errorData.message || "ImageKit upload failed");
      }

      const uploadResult: ImageKitUploadResponse = await response.json();

      // Return file information in the expected format
      return {
        file: {
          filename: uploadResult.name,
          location: uploadResult.url,
          key: uploadResult.filePath,
          fileId: uploadResult.fileId,
          size: uploadResult.size,
          mimetype: uploadResult.fileType,
          thumbnailUrl: uploadResult.thumbnailUrl,
        },
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  // Upload multiple files to ImageKit
  async uploadMultipleFiles(files: File[], folder: string = "archives") {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      const results = await Promise.allSettled(uploadPromises);

      const uploadedFiles = [];
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          uploadedFiles.push(result.value.file);
        } else {
          errors.push(
            `Upload failed for ${files[index].name}: ${result.reason}`
          );
        }
      });

      return {
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("Multiple upload error:", error);
      throw error;
    }
  }

  // File deletion method for ImageKit
  async deleteFile(fileId: string) {
    return this.request<{
      message: string;
    }>(`/upload/file/${fileId}`, {
      method: "DELETE",
    });
  }

  // Get ImageKit file metadata
  async getFileInfo(fileId: string) {
    return this.request<{
      file: {
        fileId: string;
        name: string;
        filePath: string;
        url: string;
        thumbnailUrl?: string;
        size: number;
        fileType: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/upload/file/${fileId}`, {
      method: "GET",
    });
  }

  // Archive methods
  async getArchives(filters?: {
    category?: string;
    type?: string;
    search?: string;
    decade?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const queryString = params.toString();
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
      }[];
      count: number;
    }>(`/archives${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    });
  }

  async getArchiveById(id: string) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
      };
    }>(`/archives/${id}`, {
      method: "GET",
    });
  }

  async createArchive(archiveData: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    date_taken?: string;
    location?: string;
    person_related?: string;
    imagekit_file_id: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
      };
    }>("/archives", {
      method: "POST",
      body: JSON.stringify(archiveData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async updateArchive(
    id: string,
    archiveData: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      date_taken?: string;
      location?: string;
      person_related?: string;
      imagekit_file_id: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }
  ) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
      };
    }>(`/archives/${id}`, {
      method: "PUT",
      body: JSON.stringify(archiveData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async deleteArchive(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/archives/${id}`, {
      method: "DELETE",
    });
  }

  async getArchiveStats() {
    return this.request<{
      success: boolean;
      data: {
        documents: number;
        photos: number;
        videos: number;
        audio: number;
        total: number;
        years_covered: number;
      };
    }>("/archives/stats", {
      method: "GET",
    });
  }

  async getArchiveDownloadUrl(id: string) {
    return this.request<{
      success: boolean;
      downloadUrl: string;
      filename: string;
      expiresIn: number;
    }>(`/archives/${id}/download`, {
      method: "GET",
    });
  }

  async getUserArchives() {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        category: string;
        tags: string[];
      }[];
    }>("/archives/user/my-archives", {
      method: "GET",
    });
  }

  // Complete upload workflow for archives
  async uploadAndCreateArchive(
    file: File,
    archiveMetadata: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      date_taken?: string;
      location?: string;
      person_related?: string;
    }
  ) {
    try {
      // Step 1: Upload file to ImageKit
      const uploadResult = await this.uploadFile(file, "archives");

      // Step 2: Create archive record with ImageKit metadata
      const archiveResult = await this.createArchive({
        ...archiveMetadata,
        imagekit_file_id: uploadResult.file.fileId,
        file_url: uploadResult.file.location,
        file_type: file.type,
        file_size: file.size,
      });

      return {
        success: true,
        archive: archiveResult.data,
        file: uploadResult.file,
      };
    } catch (error) {
      console.error("Complete upload workflow failed:", error);
      throw error;
    }
  }

  // Admin methods
  async getDashboardStats() {
    return this.request<{
      familyMembers: number;
      familyTreeMembers: number;
      publishedBlogs: number;
      publishedNews: number;
      approvedArchives: number;
      pendingSubmissions: number;
    }>("/admin/dashboard/stats", {
      method: "GET",
    });
  }

  // Admin archive methods
  async getAdminArchives(filters?: {
    category?: string;
    type?: string;
    search?: string;
    decade?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const queryString = params.toString();
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
    }>(`/admin/archives${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    });
  }

  async getAdminArchiveById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/admin/archives/${id}`, {
      method: "GET",
    });
  }

  async createAdminArchive(archiveData: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    date_taken?: string;
    location?: string;
    person_related?: string;
    imagekit_file_id: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>("/admin/archives", {
      method: "POST",
      body: JSON.stringify(archiveData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async updateAdminArchive(
    id: string,
    archiveData: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      date_taken?: string;
      location?: string;
      person_related?: string;
      imagekit_file_id: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }
  ) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/admin/archives/${id}`, {
      method: "PUT",
      body: JSON.stringify(archiveData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async deleteAdminArchive(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/archives/${id}`, {
      method: "DELETE",
    });
  }

  async uploadAndCreateAdminArchive(
    file: File,
    archiveMetadata: {
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      date_taken?: string;
      location?: string;
      person_related?: string;
    }
  ) {
    try {
      // Step 1: Upload file to ImageKit
      const uploadResult = await this.uploadFile(file, "archives");

      // Step 2: Create archive record with ImageKit metadata
      const archiveResult = await this.createAdminArchive({
        ...archiveMetadata,
        imagekit_file_id: uploadResult.file.fileId,
        file_url: uploadResult.file.location,
        file_type: file.type,
        file_size: file.size,
      });

      return {
        success: true,
        archive: archiveResult.data,
        file: uploadResult.file,
      };
    } catch (error) {
      console.error("Complete upload workflow failed:", error);
      throw error;
    }
  }

  async getUsers() {
    return this.request<
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "admin" | "member";
      }[]
    >("/admin/users", {
      method: "GET",
    });
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.request<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "admin" | "member";
    }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(
    id: string,
    userData: {
      email: string;
      firstName: string;
      lastName: string;
    }
  ) {
    return this.request<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "admin" | "member";
    }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  async resetUserPassword(id: string) {
    return this.request<{
      message: string;
    }>(`/admin/users/${id}/reset-password`, {
      method: "POST",
    });
  }

  async getSubmissions() {
    return this.request<
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "admin" | "member";
      }[]
    >("/admin/submissions", {
      method: "GET",
    });
  }

  async reviewSubmission(
    id: string,
    status: "approved" | "rejected",
    reviewNotes?: string
  ) {
    return this.request<{
      message: string;
    }>(`/admin/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, reviewNotes }),
    });
  }

  async getAuditLog(page = 1, limit = 50) {
    return this.request<{
      message: string;
    }>(`/admin/audit-log?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  }

  // News methods
  async getNewsArticles() {
    return this.request<
      {
        id: string;
        title: string;
        slug: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[]
    >("/news", {
      method: "GET",
    });
  }

  async getNewsArticle(slug: string) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/news/${slug}`, {
      method: "GET",
    });
  }

  async createNewsArticle(articleData: {
    title: string;
    slug: string;
    content: string;
  }) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>("/news", {
      method: "POST",
      body: JSON.stringify(articleData),
    });
  }

  async updateNewsArticle(
    id: string,
    articleData: {
      title: string;
      slug: string;
      content: string;
    }
  ) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/news/${id}`, {
      method: "PUT",
      body: JSON.stringify(articleData),
    });
  }

  async deleteNewsArticle(id: string) {
    return this.request<{ message: string }>(`/news/${id}`, {
      method: "DELETE",
    });
  }

  // Timeline methods
  async getTimelineEvents() {
    return this.request<
      {
        id: string;
        title: string;
        slug: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[]
    >("/timeline", {
      method: "GET",
    });
  }

  async getTimelineEvent(id: string) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/timeline/${id}`, {
      method: "GET",
    });
  }

  async createTimelineEvent(eventData: {
    title: string;
    slug: string;
    content: string;
  }) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>("/timeline", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(
    id: string,
    eventData: {
      title: string;
      slug: string;
      content: string;
    }
  ) {
    return this.request<{
      id: string;
      title: string;
      slug: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>(`/timeline/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  }

  async deleteTimelineEvent(id: string) {
    return this.request<{ message: string }>(`/timeline/${id}`, {
      method: "DELETE",
    });
  }

  async getTimelineEventsByDateRange(startDate: string, endDate: string) {
    return this.request<
      {
        id: string;
        title: string;
        slug: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[]
    >(`/timeline/range?startDate=${startDate}&endDate=${endDate}`, {
      method: "GET",
    });
  }

  async getTimelineEventsByType(type: string) {
    return this.request<
      {
        id: string;
        title: string;
        slug: string;
        content: string;
        createdAt: string;
        updatedAt: string;
      }[]
    >(`/timeline/type/${type}`, {
      method: "GET",
    });
  }

  // Public stats for homepage (no auth required)
  async getPublicStats() {
    return this.request<{
      familyMembers: number;
      yearsOfHistory: string;
      photosAndMedia: number;
      storiesAndDocuments: number;
    }>("/stats", {
      method: "GET",
    });
  }

  // Public stats for family history page (no auth required)
  async getFamilyHistoryStats() {
    return this.request<{
      yearsOfHistory: string;
      generations: number;
      locations: number;
    }>("/family-history/stats", {
      method: "GET",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
