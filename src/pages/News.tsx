import { useState, useEffect } from 'react';
import { Calendar, User, Tag, Search, Filter, Loader2, Newspaper } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SubmissionForm from '@/components/SubmissionForm';
import { useAuth } from '@/hooks/useAuth';

interface NewsItem {
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
const getAuthorName = (article: NewsItem) => `${article.author_first_name} ${article.author_last_name}`;
const getCategory = (content: string) => {
  // Simple category extraction - in a real app, categories would be stored separately
  const categories = ['Events', 'Births', 'Graduations', 'Anniversaries', 'Achievements'];
  return categories.find(cat => 
    content.toLowerCase().includes(cat.toLowerCase())
  ) || 'General';
};

export default function News() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newsArticles, setNewsArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchNewsArticles();
  }, []);

  const fetchNewsArticles = async () => {
    try {
      setLoading(true);
      const articles = await apiClient.getNewsArticles();
      setNewsArticles(articles.filter((article: NewsItem) => article.status === 'published'));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load news articles';
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

  // Calculate categories for all articles
  const allCategories = ['All', ...Array.from(new Set(
    newsArticles.map(article => getCategory(article.content))
  ))];

  const filteredNews = newsArticles.filter(article => {
    const articleCategory = getCategory(article.content);
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || articleCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // For now, treat first 2 articles as featured - in real app, this would be a field
  const featuredNews = filteredNews.slice(0, 2);
  const regularNews = filteredNews.slice(2);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
            <p className="mt-2 text-gray-600">Loading news articles...</p>
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
            <Button onClick={fetchNewsArticles}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Family <span className="text-yellow-600">News</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto px-2">
            Stay connected with the latest updates, celebrations, and milestones 
            from our family members around the world.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 sm:mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50 w-4 h-4" />
            <Input
              placeholder="Search family news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-primary/30 text-foreground placeholder-foreground/50 shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allCategories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category 
                  ? "gold-texture text-white hover:opacity-90" 
                  : "border-primary/30 text-foreground hover:border-primary hover:text-primary"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured News */}
        {featuredNews.length > 0 && (
          <div className="mb-12 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 flex flex-wrap items-center">
              <span className="gold-texture text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm mr-2 sm:mr-3 mb-2 sm:mb-0">Featured</span>
              <span className="text-lg sm:text-2xl">Important Announcements</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {featuredNews.map((article) => {
                const authorName = getAuthorName(article);
                const category = getCategory(article.content);
                
                return (
                  <Card key={article.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-lg">
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      {article.featured_image_url ? (
                        <img 
                          src={article.featured_image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                          <Newspaper className="w-16 h-16 text-yellow-600 opacity-50" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="gold-texture text-white">
                          {category}
                        </Badge>
                        <div className="flex items-center text-foreground/60 text-sm">
                          <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                          {new Date(article.published_at || article.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-foreground text-xl">{article.title}</CardTitle>
                      <CardDescription className="text-foreground/80">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-yellow-600 text-xs">
                            {article.author_first_name.charAt(0)}{article.author_last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground/70 text-sm">{authorName}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular News */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">Recent Updates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {regularNews.map((article) => {
              const authorName = getAuthorName(article);
              const category = getCategory(article.content);
              
              return (
                <Card key={article.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 group hover:shadow-lg">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    {article.featured_image_url ? (
                      <img 
                        src={article.featured_image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-yellow-600 opacity-50" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="border-primary/30 text-yellow-600">
                        {category}
                      </Badge>
                      <div className="flex items-center text-foreground/60 text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-yellow-600" />
                        {new Date(article.published_at || article.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-foreground group-hover:text-yellow-600 transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-yellow-600 text-xs">
                            {article.author_first_name.charAt(0)}{article.author_last_name.charAt(0)}
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
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Have Family News to Share?</h3>
              <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
                Help keep our family connected by sharing your updates, achievements, and special moments. 
                Every story matters and contributes to our rich family tapestry.
              </p>
              <div className="flex justify-center">
                {user ? (
                  <SubmissionForm 
                    type="news" 
                    onSubmissionSuccess={fetchNewsArticles}
                    triggerText="Share Your News"
                    className="gold-texture text-white hover:opacity-90 font-semibold"
                  />
                ) : (
                  <Button className="gold-texture text-white hover:opacity-90 font-semibold" disabled>
                    Login to Share News
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}