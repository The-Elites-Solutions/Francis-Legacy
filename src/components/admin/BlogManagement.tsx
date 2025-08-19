import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  status: 'draft' | 'published';
  author_first_name: string;
  author_last_name: string;
  created_at: string;
  published_at?: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageFile: File | null;
  featuredImageUrl: string; // Keep for existing posts
  status: 'draft' | 'published';
}

const BlogManagement: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImageFile: null,
    featuredImageUrl: '',
    status: 'draft'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await apiClient.getBlogPosts();
      setPosts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let featuredImageUrl = formData.featuredImageUrl;
      
      // Handle file upload if a new file is selected
      if (formData.featuredImageFile) {
        const uploadResult = await apiClient.uploadFile(formData.featuredImageFile, 'blog');
        featuredImageUrl = uploadResult.file.location;
      }
      
      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImageUrl: featuredImageUrl,
        status: formData.status
      };
      
      if (selectedPost) {
        await apiClient.updateBlogPost(selectedPost.id, postData);
        toast({
          title: 'Success',
          description: 'Blog post updated successfully',
        });
      } else {
        await apiClient.createBlogPost(postData);
        toast({
          title: 'Success',
          description: 'Blog post created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setSelectedPost(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImageFile: null,
        featuredImageUrl: '',
        status: 'draft'
      });
      fetchPosts();
    } catch (error) {
      console.error('Blog post error:', error);
      toast({
        title: 'Error',
        description: selectedPost ? 'Failed to update post' : 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImageFile: null,
      featuredImageUrl: post.featured_image_url || '',
      status: post.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await apiClient.deleteBlogPost(post.id);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const openDialog = () => {
    setSelectedPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImageFile: null,
      featuredImageUrl: '',
      status: 'draft'
    });
    setIsDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select an image smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setFormData({ ...formData, featuredImageFile: file });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <p className="text-gray-600">Create and manage blog posts</p>
        </div>
        <Button onClick={openDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Blog Post
        </Button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <CardDescription className="mt-2">
                    By {post.author_first_name} {post.author_last_name} •{' '}
                    {new Date(post.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedPost ? 'Edit Blog Post' : 'Create Blog Post'}
              </DialogTitle>
              <DialogDescription>
                {selectedPost ? 'Update the blog post details below.' : 'Fill in the details to create a new blog post.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featuredImageFile">Featured Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="featuredImageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    {formData.featuredImageFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                        <Camera className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Selected: {formData.featuredImageFile.name}
                        </span>
                      </div>
                    )}
                    {selectedPost && formData.featuredImageUrl && !formData.featuredImageFile && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <Camera className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Current image will be kept (upload new file to replace)
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Upload an image file (max 10MB). Supports JPG, PNG, and other image formats.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'draft' | 'published') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {formData.featuredImageFile ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  selectedPost ? 'Update Post' : 'Create Post'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;