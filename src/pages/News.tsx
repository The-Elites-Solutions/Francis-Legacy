import { useState } from 'react';
import { Calendar, User, Tag, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorImage?: string;
  date: string;
  category: string;
  image: string;
  featured?: boolean;
}

const newsData: NewsItem[] = [
  {
    id: '1',
    title: 'Annual Family Reunion 2024 - Save the Date!',
    excerpt: 'Join us for our biggest family gathering yet this summer at Riverside Park.',
    content: 'We are excited to announce that our annual family reunion will take place on July 15th, 2024, at Riverside Park. This year promises to be our largest gathering with over 80 family members expected to attend from across the country.',
    author: 'Margaret O\'Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1494790108755-2616b332c5b2?w=150',
    date: '2024-03-15',
    category: 'Events',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true
  },
  {
    id: '2',
    title: 'New Baby Arrival: Welcome Little Emma!',
    excerpt: 'Sarah and Michael are thrilled to welcome their daughter Emma Rose to the family.',
    content: 'We are delighted to share that Sarah and Michael welcomed their beautiful daughter Emma Rose on February 28th, 2024. Both mother and baby are healthy and doing wonderfully. Emma is the newest addition to our growing family tree!',
    author: 'David Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    date: '2024-03-01',
    category: 'Births',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    title: 'Congratulations to Graduate Thomas!',
    excerpt: 'Thomas Sullivan graduates with honors from State University with a degree in Engineering.',
    content: 'We are incredibly proud to announce that Thomas Sullivan has graduated summa cum laude from State University with a Bachelor\'s degree in Mechanical Engineering. His hard work and dedication have paid off!',
    author: 'Helen Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    date: '2024-05-20',
    category: 'Achievements',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '4',
    title: 'Golden Anniversary Celebration',
    excerpt: 'John and Mary O\'Sullivan celebrate 50 years of marriage this month.',
    content: 'Join us in celebrating John and Mary O\'Sullivan\'s 50th wedding anniversary! They were married on June 12th, 1974, and have been an inspiration to our entire family with their love and dedication to each other.',
    author: 'Patricia O\'Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    date: '2024-06-12',
    category: 'Anniversaries',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '5',
    title: 'Family Business Milestone: 100 Years!',
    excerpt: 'O\'Sullivan Bakery celebrates its centennial anniversary this year.',
    content: 'This year marks the 100th anniversary of O\'Sullivan Bakery, the family business started by our great-grandfather Patrick in 1924. The bakery continues to serve the community with the same dedication and quality recipes passed down through generations.',
    author: 'Robert Sullivan',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    date: '2024-04-10',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

const categories = ['All', 'Events', 'Births', 'Achievements', 'Anniversaries', 'Business'];

export default function News() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredNews = newsData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredNews = filteredNews.filter(item => item.featured);
  const regularNews = filteredNews.filter(item => !item.featured);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Family <span className="text-yellow-400">News</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stay connected with the latest updates, celebrations, and milestones 
            from our family members around the world.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search family news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-yellow-400/20 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={selectedCategory === category 
                  ? "bg-yellow-400 text-black hover:bg-yellow-500" 
                  : "border-yellow-400/30 text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured News */}
        {featuredNews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <span className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm mr-3">Featured</span>
              Important Announcements
            </h2>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredNews.map((item) => (
                <Card key={item.id} className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-yellow-400 text-black">
                        {item.category}
                      </Badge>
                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-white text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {item.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={item.authorImage} />
                        <AvatarFallback className="bg-yellow-400/20 text-yellow-400 text-xs">
                          {item.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-400 text-sm">{item.author}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular News */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8">Recent Updates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularNews.map((item) => (
              <Card key={item.id} className="bg-gray-900/50 border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 group">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-yellow-400/30 text-yellow-400">
                      {item.category}
                    </Badge>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="text-white group-hover:text-yellow-400 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {item.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={item.authorImage} />
                        <AvatarFallback className="bg-yellow-400/20 text-yellow-400 text-xs">
                          {item.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-400 text-sm">{item.author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300 p-0 h-auto">
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
          <Card className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-yellow-400/30">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-white mb-4">Have Family News to Share?</h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Help keep our family connected by sharing your updates, achievements, and special moments. 
                Every story matters and contributes to our rich family tapestry.
              </p>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                Share Your News
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}