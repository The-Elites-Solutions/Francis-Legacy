import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TreePine, FileText, Newspaper, Archive, CheckSquare } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  familyMembers: number;
  familyTreeMembers: number;
  publishedBlogs: number;
  publishedNews: number;
  approvedArchives: number;
  pendingSubmissions: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading dashboard: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Family Members',
      value: stats?.familyMembers || 0,
      description: 'Registered family members',
      icon: Users,
      color: 'bg-blue-500',
      path: '/admin/users',
    },
    {
      title: 'Family Tree',
      value: stats?.familyTreeMembers || 0,
      description: 'Members in family tree',
      icon: TreePine,
      color: 'bg-green-500',
      path: '/admin/family-tree',
    },
    {
      title: 'Blog Posts',
      value: stats?.publishedBlogs || 0,
      description: 'Published blog posts',
      icon: FileText,
      color: 'bg-purple-500',
      path: '/admin/blog',
    },
    {
      title: 'News Articles',
      value: stats?.publishedNews || 0,
      description: 'Published news articles',
      icon: Newspaper,
      color: 'bg-orange-500',
      path: '/admin/news',
    },
    {
      title: 'Archive Items',
      value: stats?.approvedArchives || 0,
      description: 'Approved archive items',
      icon: Archive,
      color: 'bg-yellow-500',
      path: '/admin/archive',
    },
    {
      title: 'Pending Submissions',
      value: stats?.pendingSubmissions || 0,
      description: 'Awaiting review',
      icon: CheckSquare,
      color: 'bg-red-500',
      path: '/admin/submissions',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your Francis Legacy family website
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.path}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {card.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  New family member registered
                </span>
                <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Blog post published
                </span>
                <span className="text-xs text-gray-400 ml-auto">5 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Archive item submitted
                </span>
                <span className="text-xs text-gray-400 ml-auto">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3"
                onClick={() => navigate('/admin/users')}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Add Family Member</div>
                  <div className="text-xs text-gray-500">Create a new user account</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3"
                onClick={() => navigate('/admin/submissions')}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Review Submissions</div>
                  <div className="text-xs text-gray-500">
                    {stats?.pendingSubmissions || 0} items awaiting review
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto p-3"
                onClick={() => navigate('/admin/blog')}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Manage Content</div>
                  <div className="text-xs text-gray-500">Edit blog posts and news</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;