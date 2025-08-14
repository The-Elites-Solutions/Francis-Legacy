import {
  IMAGEKIT_CONFIG,
  ImageKitUploadResponse,
  ImageKitAuthParams,
} from "./imagekit-config";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
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
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
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
      user: any;
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
    return this.request<any[]>("/family", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getFamilyMember(id: string) {
    return this.request<any>(`/family/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createFamilyMember(memberData: any) {
    return this.request<any>("/family", {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  }

  async updateFamilyMember(id: string, memberData: any) {
    return this.request<any>(`/family/${id}`, {
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
    return this.request<any[]>("/blog", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getBlogPost(slug: string) {
    return this.request<any>(`/blog/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createBlogPost(postData: any) {
    return this.request<any>("/blog", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async updateBlogPost(id: string, postData: any) {
    return this.request<any>(`/blog/${id}`, {
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      data: any[];
      count: number;
    }>(`/archives${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getArchiveById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/archives/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
      data: any;
    }>("/archives", {
      method: "POST",
      body: JSON.stringify(archiveData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async updateArchive(id: string, archiveData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getUserArchives() {
    return this.request<{
      success: boolean;
      data: any[];
    }>("/archives/user/my-archives", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getUsers() {
    return this.request<any[]>("/admin/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createUser(userData: any) {
    return this.request<any>("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/admin/users/${id}`, {
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
    return this.request<any>(`/admin/users/${id}/reset-password`, {
      method: "POST",
    });
  }

  async getSubmissions() {
    return this.request<any[]>("/admin/submissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async reviewSubmission(
    id: string,
    status: "approved" | "rejected",
    reviewNotes?: string
  ) {
    return this.request<any>(`/admin/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, reviewNotes }),
    });
  }

  async getAuditLog(page = 1, limit = 50) {
    return this.request<any>(`/admin/audit-log?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // News methods
  async getNewsArticles() {
    return this.request<any[]>("/news", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getNewsArticle(slug: string) {
    return this.request<any>(`/news/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createNewsArticle(articleData: any) {
    return this.request<any>("/news", {
      method: "POST",
      body: JSON.stringify(articleData),
    });
  }

  async updateNewsArticle(id: string, articleData: any) {
    return this.request<any>(`/news/${id}`, {
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
    return this.request<any[]>("/timeline", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getTimelineEvent(id: string) {
    return this.request<any>(`/timeline/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createTimelineEvent(eventData: any) {
    return this.request<any>("/timeline", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(id: string, eventData: any) {
    return this.request<any>(`/timeline/${id}`, {
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
    return this.request<any[]>(
      `/timeline/range?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async getTimelineEventsByType(type: string) {
    return this.request<any[]>(`/timeline/type/${type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
