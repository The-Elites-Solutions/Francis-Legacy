import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_first_name?: string;
  author_last_name?: string;
  status?: 'published' | 'draft';
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

const getReadTime = (content: string) =>
  `${Math.max(1, Math.ceil((content || '').length / 1000))} min read`;

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const data = await apiClient.getBlogPost(slug);
        if (!cancelled) setPost(data as BlogPost);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load post';
        if (/404|not found/i.test(message)) {
          setNotFound(true);
        } else {
          setError(message);
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      cancelled = true;
    };
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
          <p className="text-foreground/60 mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="gold-texture text-white hover:opacity-90">
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/blog')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const authorName =
    post.author_first_name || post.author_last_name
      ? `${post.author_first_name ?? ''} ${post.author_last_name ?? ''}`.trim()
      : 'Unknown Author';
  const displayDate = new Date(
    post.published_at || post.created_at || Date.now()
  ).toLocaleDateString();
  const initials = `${(post.author_first_name ?? '?').charAt(0)}${(
    post.author_last_name ?? ''
  ).charAt(0)}`;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="text-yellow-600 hover:text-primary">
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <Card className="bg-white shadow-md border-primary/30">
          {post.featured_image_url && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6 sm:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-primary/20">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-yellow-600">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-foreground font-medium">{authorName}</div>
              </div>
              <div className="flex items-center text-sm text-foreground/60">
                <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                {displayDate}
              </div>
              <div className="flex items-center text-sm text-foreground/60">
                <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                {getReadTime(post.content)}
              </div>
            </div>

            <article
              className="prose prose-lg max-w-none text-foreground/90 prose-headings:text-foreground prose-a:text-yellow-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
