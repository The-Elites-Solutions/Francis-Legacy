const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

  // File upload methods
  async uploadFile(file: File, folder: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload/${folder}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  }

  async uploadMultipleFiles(files: File[], folder: string) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseURL}/upload/${folder}/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
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