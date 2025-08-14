import { useState, useEffect } from 'react';
import { ArrowRight, Users, Calendar, Image, FileText, BookOpen, TreePine, Newspaper, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

interface Stats {
  familyMembers: number;
  yearsOfHistory: string;
  photosAndMedia: number;
  storiesAndDocuments: number;
}

const quickLinks = [
  {
    title: 'Explore Family History',
    description: 'Discover the rich tapestry of our family\'s journey through time',
    href: '/family-history',
    color: 'from-yellow-400 to-yellow-600',
    icon: BookOpen
  },
  {
    title: 'View Family Tree',
    description: 'Navigate through generations of family connections',
    href: '/family-tree',
    color: 'from-yellow-500 to-amber-600',
    icon: TreePine
  },
  {
    title: 'Latest News',
    description: 'Stay updated with recent family events and announcements',
    href: '/news',
    color: 'from-amber-400 to-orange-500',
    icon: Newspaper
  },
  {
    title: 'Family Blog',
    description: 'Read stories and experiences shared by family members',
    href: '/blog',
    color: 'from-orange-400 to-red-500',
    icon: PenTool
  }
];

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    familyMembers: 0,
    yearsOfHistory: '150+',
    photosAndMedia: 0,
    storiesAndDocuments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getPublicStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep default stats if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsArray = [
    { label: 'Family Members', value: isLoading ? '...' : stats.familyMembers.toString(), icon: Users },
    { label: 'Years of History', value: stats.yearsOfHistory, icon: Calendar },
    { label: 'Photos & Media', value: isLoading ? '...' : stats.photosAndMedia.toString(), icon: Image },
    { label: 'Stories & Documents', value: isLoading ? '...' : stats.storiesAndDocuments.toString(), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/20 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 opacity-70"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Our Family
              <span className="block text-yellow-600">Legacy Lives Here</span>
            </h1>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              Welcome to the Francis Legacy digital collection. Explore generations of stories,
              memories, and connections that make us who we are today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-yellow-600 text-white font-semibold hover:opacity-90">
                <Link to="/family-tree" className="flex items-center">
                  Explore Family Tree
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-foreground hover:bg-primary/10">
                <Link to="/family-history">
                  View Our History
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsArray.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 gold-texture rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-foreground/70">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Discover Your Heritage
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Navigate through different sections of the Francis Legacy collection to uncover stories,
              connections, and memories that span generations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Card key={index} className="bg-white border-primary/20 hover:border-primary/40 shadow-md transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg gold-texture mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-sm" />
                    </div>
                    <CardTitle className="text-foreground text-xl">{link.title}</CardTitle>
                    <CardDescription className="text-foreground/70">
                      {link.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="ghost" className="text-yellow-600 p-0 h-auto">
                      <Link to={link.href} className="flex items-center">
                        Explore now
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
