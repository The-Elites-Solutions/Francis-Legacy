import { useState } from 'react';
import { Calendar, User, Clock, Tag, Search, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorImage?: string;
  authorBio?: string;
  date: string;
  readTime: string;
  tags: string[];
  image: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Grandmother\'s Secret Recipe Collection',
    excerpt: 'A heartwarming journey through three generations of family recipes that tell the story of our heritage.',
    content: 'When I opened my grandmother\'s old recipe box last month, I discovered more than just cooking instructions. Each handwritten card told a story of love, tradition, and family gatherings that spanned decades.',
    author: 'Margaret O\'Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1494790108755-2616b332c5b2?w=150',
    authorBio: 'Family historian and keeper of traditions',
    date: '2024-06-15',
    readTime: '8 min read',
    tags: ['Recipes', 'Traditions', 'Heritage'],
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true
  },
  {
    id: '2',
    title: 'Growing Up in the Old Neighborhood',
    excerpt: 'Memories of childhood in Brooklyn during the 1960s, when every neighbor was family.',
    content: 'The streets of our old Brooklyn neighborhood were more than just pavement and buildings - they were the foundation of community that shaped who we became as a family.',
    author: 'Robert Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    authorBio: 'Retired teacher and storyteller',
    date: '2024-05-28',
    readTime: '6 min read',
    tags: ['Childhood', 'Brooklyn', 'Community'],
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    title: 'The Great Family Adventure: Cross-Country Road Trip 1985',
    excerpt: 'How a simple vacation became a legendary family story that we still talk about today.',
    content: 'Thirty-nine years ago, our family packed into a station wagon for what was supposed to be a simple two-week vacation. Little did we know it would become the adventure of a lifetime.',
    author: 'David Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    authorBio: 'Marketing professional and adventure enthusiast',
    date: '2024-07-02',
    readTime: '10 min read',
    tags: ['Travel', 'Adventure', '1980s'],
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '4',
    title: 'Letters from Great Uncle Thomas: A WWII Story',
    excerpt: 'Recently discovered letters reveal untold stories from the Pacific Theater during World War II.',
    content: 'While cleaning out the attic, we found a box of letters that had been forgotten for decades. These letters from Uncle Thomas paint a vivid picture of life during wartime.',
    author: 'Helen Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    authorBio: 'History teacher and family archivist',
    date: '2024-06-20',
    readTime: '12 min read',
    tags: ['WWII', 'Letters', 'History'],
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '5',
    title: 'Building the Family Business: Lessons from Three Generations',
    excerpt: 'How our family bakery survived the Great Depression, two world wars, and countless challenges.',
    content: 'The O\'Sullivan Bakery isn\'t just a business - it\'s a testament to resilience, hard work, and the power of family unity through good times and bad.',
    author: 'Michael O\'Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    authorBio: 'Third-generation baker and business owner',
    date: '2024-05-10',
    readTime: '9 min read',
    tags: ['Business', 'Heritage', 'Resilience'],
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

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
                ? "text-yellow-600ure text-white hover:opacity-90" 
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
                  ? "text-yellow-600ure text-white hover:opacity-90" 
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
              <span className="text-yellow-600ure text-white px-3 py-1 rounded-md text-sm mr-3">Featured</span>
              Stories Worth Reading
            </h2>
            <div className="grid lg:grid-cols-1 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all duration-300">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-square overflow-hidden rounded-l-lg">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          {post.tags.map((tag) => (
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
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                              {post.readTime}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10 border border-primary/20">
                              <AvatarImage src={post.authorImage} />
                              <AvatarFallback className="bg-primary/10 text-yellow-600">
                                {post.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-foreground font-medium">{post.author}</div>
                              {post.authorBio && (
                                <div className="text-foreground/60 text-sm">{post.authorBio}</div>
                              )}
                            </div>
                          </div>
                          <Button className="text-yellow-600ure text-white hover:opacity-90">
                            Read Story
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8">Recent Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card key={post.id} className="bg-white shadow-md border-primary/30 hover:border-primary/60 transition-all duration-300 group hover:shadow-lg">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
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
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                      {post.readTime}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8 border border-primary/20">
                        <AvatarImage src={post.authorImage} />
                        <AvatarFallback className="bg-primary/10 text-yellow-600 text-xs">
                          {post.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground/70 text-sm">{post.author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-primary p-0 h-auto">
                      Read more
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Card className="bg-white shadow-md border-primary/30">
            <CardContent className="py-12">
              <div className="w-20 h-20 rounded-full text-yellow-600ure flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Share Your Story</h3>
              <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
                Do you have a family story, memory, or experience you'd like to share? 
                Your contributions help preserve our family legacy for future generations.
              </p>
              <Button className="text-yellow-600ure text-white hover:opacity-90 font-semibold">
                Write a Blog Post
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}