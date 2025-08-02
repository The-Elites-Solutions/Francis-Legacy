import { ArrowRight, Users, Calendar, Image, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Family Members', value: '127', icon: Users },
  { label: 'Years of History', value: '150+', icon: Calendar },
  { label: 'Photos & Media', value: '2,847', icon: Image },
  { label: 'Stories & Documents', value: '156', icon: FileText },
];

const quickLinks = [
  {
    title: 'Explore Family History',
    description: 'Discover the rich tapestry of our family\'s journey through time',
    href: '/family-history',
    color: 'from-yellow-400 to-yellow-600'
  },
  {
    title: 'View Family Tree',
    description: 'Navigate through generations of family connections',
    href: '/family-tree',
    color: 'from-yellow-500 to-amber-600'
  },
  {
    title: 'Latest News',
    description: 'Stay updated with recent family events and announcements',
    href: '/news',
    color: 'from-amber-400 to-orange-500'
  },
  {
    title: 'Family Blog',
    description: 'Read stories and experiences shared by family members',
    href: '/blog',
    color: 'from-orange-400 to-red-500'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center opacity-30"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Our Family
              <span className="block text-yellow-400">Legacy Lives Here</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Welcome to the Francis Legacy digital collection. Explore generations of stories, 
              memories, and connections that make us who we are today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                <Link to="/family-tree" className="flex items-center">
                  Explore Family Tree
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                <Link to="/family-history">
                  View Our History
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-400/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Discover Your Heritage
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Navigate through different sections of the Francis Legacy collection to uncover stories, 
              connections, and memories that span generations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {quickLinks.map((link, index) => (
              <Card key={index} className="bg-gray-900/50 border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${link.color} mb-4 group-hover:scale-110 transition-transform duration-300`}></div>
                  <CardTitle className="text-white text-xl">{link.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {link.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="text-yellow-400 hover:text-yellow-300 p-0 h-auto">
                    <Link to={link.href} className="flex items-center">
                      Explore now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Recent Francis Legacy Updates</h2>
            <p className="text-gray-400">Stay connected with the latest additions to the Francis Legacy collection</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">New Family Photos Added</CardTitle>
                <CardDescription className="text-gray-400">
                  Recent family reunion photos from summer 2024
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">2 days ago</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Story: Grandmother's Recipe Collection</CardTitle>
                <CardDescription className="text-gray-400">
                  A heartwarming collection of traditional family recipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">1 week ago</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Family Tree Updated</CardTitle>
                <CardDescription className="text-gray-400">
                  Added new branch with recently discovered relatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">2 weeks ago</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}