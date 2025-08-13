import { useState, useEffect } from 'react';
import { Calendar, User, Clock, Tag, Search, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url?: string;
  author_first_name: string;
  author_last_name: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// Helper functions
const getAuthorName = (post: BlogPost) => `${post.author_first_name} ${post.author_last_name}`;
const getReadTime = (content: string) => `${Math.max(1, Math.ceil(content.length / 1000))} min read`;
const extractTags = (content: string) => {
  // Simple tag extraction from content - in a real app, tags would be stored separately
  const commonWords = ['family', 'heritage', 'tradition', 'story', 'memories', 'history'];
  return commonWords.filter(word => 
    content.toLowerCase().includes(word.toLowerCase())
  ).slice(0, 3);
};

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const posts = await apiClient.getBlogPosts();
      setBlogPosts(posts.filter((post: BlogPost) => post.status === 'published'));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blog posts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate tags for all posts
  const allTags = Array.from(new Set(
    blogPosts.flatMap(post => extractTags(post.content))
  ));

  const filteredPosts = blogPosts.filter(post => {
    const postTags = extractTags(post.content);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         postTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || postTags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // For now, treat first 2 posts as featured - in real app, this would be a field
  const featuredPosts = filteredPosts.slice(0, 2);
  const regularPosts = filteredPosts.slice(2);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
            <p className="mt-2 text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={fetchBlogPosts}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Family <span className="text-yellow-600">Blog</span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Personal stories, memories, and experiences shared by family members. 
            Each post adds another layer to our rich family narrative.
          </p>
        </div>

        {/* Search and Tags */}
        <div className="mb-12 space-y-6">
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
              <Input
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/50 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => setSelectedTag(null)}
              variant={!selectedTag ? "default" : "outline"}
              size="sm"
              className={!selectedTag 
                ? "gold-texture text-white hover:opacity-90" 
                : "border-primary/30 text-foreground hover:border-primary hover:text-primary"
              }
            >
              All Posts
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                className={selectedTag === tag 
                  ? "gold-texture text-white hover:opacity-90" 
                  : "border-primary/30 text-foreground hover:border-primary hover:text-primary"
                }
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center">
              <span className="gold-texture text-white px-3 py-1 rounded-md text-sm mr-3">Featured</span>
              Stories Worth Reading
            </h2>
            <div className="grid lg:grid-cols-1 gap-8">
              {featuredPosts.map((post) => {
                const postTags = extractTags(post.content);
                const authorName = getAuthorName(post);
                const readTime = getReadTime(post.content);
                
                return (
                  <Card key={post.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all duration-300">
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-video md:aspect-square overflow-hidden rounded-l-lg">
                        <img 
                          src={post.featured_image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            {postTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="border-primary/30 text-yellow-600">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="text-2xl font-bold text-foreground mb-3">{post.title}</h3>
                          <p className="text-foreground/80 mb-4">{post.excerpt}</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-foreground/60">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                                {new Date(post.published_at || post.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                                {readTime}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-yellow-600">
                                  {post.author_first_name.charAt(0)}{post.author_last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-foreground font-medium">{authorName}</div>
                              </div>
                            </div>
                            <Button className="gold-texture text-white hover:opacity-90">
                              Read Story
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Recent Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => {
              const postTags = extractTags(post.content);
              const authorName = getAuthorName(post);
              const readTime = getReadTime(post.content);
              
              return (
                <Card key={post.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 group hover:shadow-lg">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={post.featured_image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {postTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-primary/30 text-yellow-600 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-foreground group-hover:text-yellow-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-foreground/60 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                        {readTime}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-yellow-600 text-xs">
                            {post.author_first_name.charAt(0)}{post.author_last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground/70 text-sm">{authorName}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-primary p-0 h-auto">
                        Read more
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Card className="bg-white shadow-md border-primary/30">
            <CardContent className="py-12">
              <div className="w-20 h-20 rounded-full gold-texture flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Share Your Story</h3>
              <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
                Do you have a family story, memory, or experience you'd like to share? 
                Your contributions help preserve our family legacy for future generations.
              </p>
              <Button className="gold-texture text-white hover:opacity-90 font-semibold">
                Write a Blog Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}