const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://16.171.168.132:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('francis_legacy_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem('francis_legacy_token', response.token);
    localStorage.setItem('francis_legacy_user', JSON.stringify(response.user));

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
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.token = response.token;
    localStorage.setItem('francis_legacy_token', response.token);
    localStorage.setItem('francis_legacy_user', JSON.stringify(response.user));

    return response;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('francis_legacy_token');
    localStorage.removeItem('francis_legacy_user');
  }

  // Family methods
  async getFamilyMembers() {
    return this.request<any[]>('/family');
  }

  async getFamilyMember(id: string) {
    return this.request<any>(`/family/${id}`);
  }

  async createFamilyMember(memberData: any) {
    return this.request<any>('/family', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateFamilyMember(id: string, memberData: any) {
    return this.request<any>(`/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async deleteFamilyMember(id: string) {
    return this.request<{ message: string }>(`/family/${id}`, {
      method: 'DELETE',
    });
  }

  // Blog methods
  async getBlogPosts() {
    return this.request<any[]>('/blog');
  }

  async getBlogPost(slug: string) {
    return this.request<any>(`/blog/${slug}`);
  }

  async createBlogPost(postData: any) {
    return this.request<any>('/blog', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updateBlogPost(id: string, postData: any) {
    return this.request<any>(`/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request<{ message: string }>(`/blog/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload methods using presigned URLs (recommended S3 pattern)
  async uploadFile(file: File, folder: string) {
    try {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await this.request<{
        uploadData: {
          url: string;
          fields: Record<string, string>;
          key: string;
          bucket: string;
        };
      }>(`/upload/${folder}/presigned-url`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      const { uploadData } = presignedResponse;

      // Step 2: Upload directly to S3 using presigned POST
      const formData = new FormData();
      
      // Add all the fields from presigned POST (order matters)
      Object.entries(uploadData.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add the file last (required by S3)
      formData.append('file', file);

      const s3Response = await fetch(uploadData.url, {
        method: 'POST',
        body: formData,
      });

      if (!s3Response.ok) {
        const errorText = await s3Response.text();
        console.error('S3 upload failed:', errorText);
        throw new Error('Direct S3 upload failed');
      }

      // Return file information
      return {
        file: {
          filename: uploadData.key.split('/').pop(),
          location: `https://${uploadData.bucket}.s3.amazonaws.com/${uploadData.key}`,
          key: uploadData.key,
          size: file.size,
          mimetype: file.type
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[], folder: string) {
    try {
      // Step 1: Get presigned URLs for all files
      const fileData = files.map(file => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }));

      const presignedResponse = await this.request<{
        uploadDataArray: Array<{
          fileName: string;
          url: string;
          fields: Record<string, string>;
          key: string;
          bucket: string;
        }>;
        errors?: string[];
      }>(`/upload/${folder}/multiple/presigned-urls`, {
        method: 'POST',
        body: JSON.stringify({ files: fileData })
      });

      const { uploadDataArray, errors } = presignedResponse;

      if (errors && errors.length > 0) {
        console.warn('Some files had validation errors:', errors);
      }

      // Step 2: Upload each file directly to S3
      const uploadPromises = uploadDataArray.map(async (uploadData, index) => {
        const file = files.find(f => f.name === uploadData.fileName);
        if (!file) {
          throw new Error(`File not found: ${uploadData.fileName}`);
        }

        const formData = new FormData();
        
        // Add presigned POST fields
        Object.entries(uploadData.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Add the file last
        formData.append('file', file);

        const s3Response = await fetch(uploadData.url, {
          method: 'POST',
          body: formData,
        });

        if (!s3Response.ok) {
          const errorText = await s3Response.text();
          console.error(`S3 upload failed for ${file.name}:`, errorText);
          throw new Error(`Upload failed for ${file.name}`);
        }

        return {
          filename: uploadData.key.split('/').pop(),
          location: `https://${uploadData.bucket}.s3.amazonaws.com/${uploadData.key}`,
          key: uploadData.key,
          size: file.size,
          mimetype: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      return {
        files: uploadedFiles,
        errors: errors
      };
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }

  // File download method
  async getFileDownloadUrl(folder: string, key: string) {
    return this.request<{
      downloadUrl: string;
      expiresIn: number;
    }>(`/upload/${folder}/${key}/download`);
  }

  // File deletion method
  async deleteFile(folder: string, key: string) {
    return this.request<{
      message: string;
    }>(`/upload/${folder}/${key}`, {
      method: 'DELETE'
    });
  }

  // Get file metadata
  async getFileInfo(folder: string, key: string) {
    return this.request<{
      fileInfo: {
        contentType: string;
        contentLength: number;
        lastModified: string;
        etag: string;
      };
    }>(`/upload/${folder}/${key}/info`);
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
    }>(`/archives${queryString ? `?${queryString}` : ''}`);
  }

  async getArchiveById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/archives/${id}`);
  }

  async createArchive(archiveData: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    date_taken?: string;
    location?: string;
    person_related?: string;
    s3_key: string;
    file_type: string;
    file_size: number;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>('/archives', {
      method: 'POST',
      body: JSON.stringify(archiveData)
    });
  }

  async updateArchive(id: string, archiveData: any) {
    return this.request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/archives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(archiveData)
    });
  }

  async deleteArchive(id: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/archives/${id}`, {
      method: 'DELETE'
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
    }>('/archives/stats');
  }

  async getArchiveDownloadUrl(id: string) {
    return this.request<{
      success: boolean;
      downloadUrl: string;
      filename: string;
      expiresIn: number;
    }>(`/archives/${id}/download`);
  }

  async getUserArchives() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/archives/user/my-archives');
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
      // Step 1: Upload file to S3
      const uploadResult = await this.uploadFile(file, 'archives');
      const s3Key = uploadResult.file.key;
      
      // Step 2: Create archive record with S3 metadata
      const archiveResult = await this.createArchive({
        ...archiveMetadata,
        s3_key: s3Key,
        file_type: file.type,
        file_size: file.size
      });
      
      return {
        success: true,
        archive: archiveResult.data,
        file: uploadResult.file
      };
    } catch (error) {
      console.error('Complete upload workflow failed:', error);
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
    }>('/admin/dashboard/stats');
  }

  async getUsers() {
    return this.request<any[]>('/admin/users');
  }

  async createUser(userData: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(id: string) {
    return this.request<any>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
    });
  }

  async getSubmissions() {
    return this.request<any[]>('/admin/submissions');
  }

  async reviewSubmission(id: string, status: 'approved' | 'rejected', reviewNotes?: string) {
    return this.request<any>(`/admin/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewNotes }),
    });
  }

  async getAuditLog(page = 1, limit = 50) {
    return this.request<any>(`/admin/audit-log?page=${page}&limit=${limit}`);
  }

  // News methods
  async getNewsArticles() {
    return this.request<any[]>('/news');
  }

  async getNewsArticle(slug: string) {
    return this.request<any>(`/news/${slug}`);
  }

  async createNewsArticle(articleData: any) {
    return this.request<any>('/news', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  }

  async updateNewsArticle(id: string, articleData: any) {
    return this.request<any>(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  }

  async deleteNewsArticle(id: string) {
    return this.request<{ message: string }>(`/news/${id}`, {
      method: 'DELETE',
    });
  }

  // Timeline methods
  async getTimelineEvents() {
    return this.request<any[]>('/timeline');
  }

  async getTimelineEvent(id: string) {
    return this.request<any>(`/timeline/${id}`);
  }

  async createTimelineEvent(eventData: any) {
    return this.request<any>('/timeline', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateTimelineEvent(id: string, eventData: any) {
    return this.request<any>(`/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteTimelineEvent(id: string) {
    return this.request<{ message: string }>(`/timeline/${id}`, {
      method: 'DELETE',
    });
  }

  async getTimelineEventsByDateRange(startDate: string, endDate: string) {
    return this.request<any[]>(`/timeline/range?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTimelineEventsByType(type: string) {
    return this.request<any[]>(`/timeline/type/${type}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
