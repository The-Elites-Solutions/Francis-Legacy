import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TreePine, FileText, Newspaper, Archive, CheckSquare, RefreshCw, Clock, User, Settings, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  familyMembers: number;
  familyTreeMembers: number;
  publishedBlogs: number;
  publishedNews: number;
  publishedArchives: number;
  pendingSubmissions: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  ip_address: string;
  created_at: string;
  admin_first_name: string;
  admin_last_name: string;
}

// Helper functions for activity formatting
const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE_USER':
    case 'UPDATE_USER':
      return <User className="h-4 w-4" />;
    case 'DELETE_USER':
      return <User className="h-4 w-4 text-red-500" />;
    case 'RESET_PASSWORD':
      return <Settings className="h-4 w-4" />;
    case 'REVIEW_SUBMISSION':
      return <Eye className="h-4 w-4" />;
    case 'CREATE_FAMILY_MEMBER':
    case 'UPDATE_FAMILY_MEMBER':
    case 'DELETE_FAMILY_MEMBER':
      return <Users className="h-4 w-4" />;
    case 'CREATE_BLOG_POST':
    case 'UPDATE_BLOG_POST':
    case 'DELETE_BLOG_POST':
      return <FileText className="h-4 w-4" />;
    case 'CREATE_NEWS_ARTICLE':
    case 'UPDATE_NEWS_ARTICLE':
    case 'DELETE_NEWS_ARTICLE':
      return <Newspaper className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE_USER':
    case 'CREATE_FAMILY_MEMBER':
    case 'CREATE_BLOG_POST':
    case 'CREATE_NEWS_ARTICLE':
      return 'bg-green-500';
    case 'UPDATE_USER':
    case 'UPDATE_FAMILY_MEMBER':
    case 'UPDATE_BLOG_POST':
    case 'UPDATE_NEWS_ARTICLE':
      return 'bg-blue-500';
    case 'DELETE_USER':
    case 'DELETE_FAMILY_MEMBER':
    case 'DELETE_BLOG_POST':
    case 'DELETE_NEWS_ARTICLE':
      return 'bg-red-500';
    case 'RESET_PASSWORD':
      return 'bg-orange-500';
    case 'REVIEW_SUBMISSION':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const formatAction = (action: string, targetType: string, adminName: string) => {
  const name = adminName || 'Admin';
  switch (action) {
    case 'CREATE_USER':
      return `${name} created a new user`;
    case 'UPDATE_USER':
      return `${name} updated user details`;
    case 'DELETE_USER':
      return `${name} deleted a user`;
    case 'RESET_PASSWORD':
      return `${name} reset user password`;
    case 'REVIEW_SUBMISSION':
      return `${name} reviewed a submission`;
    case 'CREATE_FAMILY_MEMBER':
      return `${name} added a new family member`;
    case 'UPDATE_FAMILY_MEMBER':
      return `${name} updated family member details`;
    case 'DELETE_FAMILY_MEMBER':
      return `${name} removed a family member`;
    case 'CREATE_BLOG_POST':
      return `${name} created a blog post`;
    case 'UPDATE_BLOG_POST':
      return `${name} updated a blog post`;
    case 'DELETE_BLOG_POST':
      return `${name} deleted a blog post`;
    case 'CREATE_NEWS_ARTICLE':
      return `${name} created a news article`;
    case 'UPDATE_NEWS_ARTICLE':
      return `${name} updated a news article`;
    case 'DELETE_NEWS_ARTICLE':
      return `${name} deleted a news article`;
    default:
      return `${name} performed ${action.toLowerCase().replace('_', ' ')}`;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Fetch both stats and recent activities
      const [statsData, activitiesData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getAuditLog(1, 10) // Get last 10 activities
      ]);
      
      setStats(statsData);
      setRecentActivities(activitiesData.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
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
      value: stats?.publishedArchives || 0,
      description: 'Published archive items',
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your Francis Legacy family website
          </p>
        </div>
        <Button 
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => {
                  const adminName = activity.admin_first_name && activity.admin_last_name
                    ? `${activity.admin_first_name} ${activity.admin_last_name}`
                    : 'Admin';
                  
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getActionColor(activity.action)}`}></div>
                      <span className="text-sm text-gray-600 flex-1">
                        {formatAction(activity.action, activity.target_type, adminName)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-4">
                  <span className="text-sm text-gray-500">No recent activities</span>
                </div>
              )}
            </div>
            {recentActivities.length > 5 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/admin/activity')}
                >
                  View All Activities
                </Button>
              </div>
            )}
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