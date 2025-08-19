import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RefreshCw, Clock, User, Settings, Eye, ChevronLeft, ChevronRight, Users, FileText, Newspaper } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatRelativeTime = (timestamp: string) => {
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

const ActivityPage: React.FC = () => {
  const [auditData, setAuditData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const { toast } = useToast();

  const fetchAuditLog = async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await apiClient.getAuditLog(page, itemsPerPage);
      setAuditData(response);
      setCurrentPage(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit log';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLog(1);
  }, [itemsPerPage]);

  const handleRefresh = () => {
    fetchAuditLog(currentPage, true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && auditData && page <= auditData.pagination.totalPages) {
      fetchAuditLog(page);
    }
  };

  const filteredLogs = auditData?.logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.admin_first_name + ' ' + log.admin_last_name).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  }) || [];

  const uniqueActions = Array.from(new Set(auditData?.logs.map(log => log.action) || []));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !auditData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading activity log: {error}</p>
            <Button onClick={() => fetchAuditLog(1)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">
            Complete audit trail of admin actions and system events
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Action Type</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Items per page</label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                {auditData && `Showing ${filteredLogs.length} of ${auditData.pagination.total} activities`}
              </CardDescription>
            </div>
            {auditData && auditData.pagination.totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {auditData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= auditData.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const adminName = log.admin_first_name && log.admin_last_name
                  ? `${log.admin_first_name} ${log.admin_last_name}`
                  : 'Admin';
                
                return (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-2 ${getActionColor(log.action)}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <Badge variant="outline" className="text-xs">
                              {log.action.replace('_', ' ')}
                            </Badge>
                            {log.target_type && (
                              <Badge variant="secondary" className="text-xs">
                                {log.target_type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(log.created_at)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">
                          {formatAction(log.action, log.target_type, adminName)}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Time:</span> {formatTimestamp(log.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">IP:</span> {log.ip_address || 'Unknown'}
                          </div>
                          {log.target_id && (
                            <div>
                              <span className="font-medium">Target ID:</span> {log.target_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                        
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedAction !== 'All' 
                    ? 'Try adjusting your search or filters' 
                    : 'No audit log entries available'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {auditData && auditData.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {auditData.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= auditData.pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(auditData.pagination.totalPages)}
              disabled={currentPage >= auditData.pagination.totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;