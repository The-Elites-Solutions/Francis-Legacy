import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, Newspaper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
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

const inferCategory = (content: string) => {
  const categories = ['Events', 'Births', 'Graduations', 'Anniversaries', 'Achievements'];
  return (
    categories.find((cat) =>
      (content || '').toLowerCase().includes(cat.toLowerCase())
    ) || 'General'
  );
};

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const data = await apiClient.getNewsArticle(slug);
        if (!cancelled) setArticle(data as NewsArticle);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load article';
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

    fetchArticle();
    return () => {
      cancelled = true;
    };
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
          <p className="mt-2 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Newspaper className="w-16 h-16 mx-auto text-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1>
          <p className="text-foreground/60 mb-6">
            The news article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="gold-texture text-white hover:opacity-90">
            <Link to="/news">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
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
            <Button onClick={() => navigate('/news')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const authorName =
    article.author_first_name || article.author_last_name
      ? `${article.author_first_name ?? ''} ${article.author_last_name ?? ''}`.trim()
      : 'Unknown Author';
  const displayDate = new Date(
    article.published_at || article.created_at || Date.now()
  ).toLocaleDateString();
  const initials = `${(article.author_first_name ?? '?').charAt(0)}${(
    article.author_last_name ?? ''
  ).charAt(0)}`;
  const category = inferCategory(article.content);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="text-yellow-600 hover:text-primary">
            <Link to="/news">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Link>
          </Button>
        </div>

        <Card className="bg-white shadow-md border-primary/30">
          {article.featured_image_url && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6 sm:p-10">
            <div className="flex items-center justify-between mb-4">
              <Badge className="gold-texture text-white">{category}</Badge>
              <div className="flex items-center text-sm text-foreground/60">
                <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                {displayDate}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              {article.title}
            </h1>

            <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-primary/20">
              <Avatar className="w-10 h-10 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-yellow-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-foreground font-medium">{authorName}</div>
            </div>

            <article
              className="prose prose-lg max-w-none text-foreground/90 prose-headings:text-foreground prose-a:text-yellow-600"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
