import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, FileText, Image, Newspaper } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ContentSubmission {
  id: string;
  type: 'blog' | 'news' | 'archive';
  title: string;
  content: any;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  submitter_first_name: string;
  submitter_last_name: string;
  created_at: string;
  review_notes?: string;
}

const ModerationQueue: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await apiClient.getSubmissions();
      setSubmissions(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submission: ContentSubmission, status: 'approved' | 'rejected') => {
    try {
      await apiClient.reviewSubmission(submission.id, status, reviewNotes);
      toast({
        title: 'Success',
        description: `Submission ${status} successfully`,
      });
      setIsDialogOpen(false);
      setSelectedSubmission(null);
      setReviewNotes('');
      fetchSubmissions();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${status} submission`,
        variant: 'destructive',
      });
    }
  };

  const openReviewDialog = (submission: ContentSubmission) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.review_notes || '');
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      case 'archive':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  const renderContent = (content: any, type: string) => {
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        return <p className="text-sm text-gray-600">Invalid content format</p>;
      }
    }

    switch (type) {
      case 'blog':
      case 'news':
        return (
          <div className="space-y-2">
            <p className="text-sm"><strong>Title:</strong> {content.title}</p>
            <p className="text-sm"><strong>Excerpt:</strong> {content.excerpt}</p>
            <div className="text-sm">
              <strong>Content:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto">
                {content.content?.substring(0, 200)}...
              </div>
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="space-y-2">
            <p className="text-sm"><strong>Title:</strong> {content.title}</p>
            <p className="text-sm"><strong>Description:</strong> {content.description}</p>
            <p className="text-sm"><strong>Category:</strong> {content.category}</p>
            {content.fileUrl && (
              <p className="text-sm"><strong>File:</strong> 
                <a href={content.fileUrl} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline ml-1">View File</a>
              </p>
            )}
          </div>
        );
      default:
        return <p className="text-sm text-gray-600">No content preview available</p>;
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    activeTab === 'all' ? true : submission.status === activeTab
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Moderation</h2>
        <p className="text-gray-600">Review and moderate content submissions from family members</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({submissions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({submissions.filter(s => s.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({submissions.filter(s => s.status === 'rejected').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No submissions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(submission.type)}
                          <div>
                            <CardTitle className="text-lg">{submission.title}</CardTitle>
                            <CardDescription>
                              {submission.type.charAt(0).toUpperCase() + submission.type.slice(1)} • 
                              Submitted by {submission.submitter_first_name} {submission.submitter_last_name} • 
                              {new Date(submission.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(submission.status)}
                        {submission.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(submission)}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderContent(submission.content, submission.type)}
                    {submission.review_notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Review Notes:</p>
                        <p className="text-sm text-gray-600 mt-1">{submission.review_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Review and moderate this {selectedSubmission?.type} submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium mb-2">Submission Details</h4>
                {renderContent(selectedSubmission.content, selectedSubmission.type)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => selectedSubmission && handleReview(selectedSubmission, 'rejected')}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              type="button"
              onClick={() => selectedSubmission && handleReview(selectedSubmission, 'approved')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModerationQueue;