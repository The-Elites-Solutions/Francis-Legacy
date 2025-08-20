import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { FileText, Newspaper, Archive, Plus, Upload } from 'lucide-react';

interface SubmissionFormProps {
  type: 'news' | 'blog' | 'archive';
  onSubmissionSuccess?: () => void;
  triggerText?: string;
  className?: string;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ 
  type, 
  onSubmissionSuccess,
  triggerText,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    description: '',
    dateTaken: '',
    location: '',
    personRelated: '',
    tags: [] as string[],
    file: null as File | null,
  });
  const { toast } = useToast();

  const getIcon = () => {
    switch (type) {
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'news':
        return 'News Article';
      case 'blog':
        return 'Blog Post';
      case 'archive':
        return 'Archive Item';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      description: '',
      dateTaken: '',
      location: '',
      personRelated: '',
      tags: [],
      file: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let content;

      if (type === 'news' || type === 'blog') {
        if (!formData.title || !formData.excerpt || !formData.content) {
          toast({
            title: 'Error',
            description: 'Title, excerpt, and content are required',
            variant: 'destructive',
          });
          return;
        }

        content = {
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
        };
      } else if (type === 'archive') {
        if (!formData.title || !formData.description || !formData.file) {
          toast({
            title: 'Error',
            description: 'Title, description, and file are required for archives',
            variant: 'destructive',
          });
          return;
        }

        // For archive submissions, we'll include file metadata
        // The actual file upload will be handled separately when approved
        content = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          dateTaken: formData.dateTaken,
          location: formData.location,
          personRelated: formData.personRelated,
          fileName: formData.file.name,
          fileSize: formData.file.size,
          fileType: formData.file.type,
        };
      }

      await apiClient.createSubmission({
        type,
        title: formData.title,
        content,
      });

      toast({
        title: 'Success',
        description: `Your ${getTypeLabel().toLowerCase()} has been submitted for review`,
      });

      resetForm();
      setIsOpen(false);
      onSubmissionSuccess?.();
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    if (type === 'news' || type === 'blog') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={`Enter ${getTypeLabel().toLowerCase()} title`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder="Brief summary or excerpt"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={`Write your ${getTypeLabel().toLowerCase()} content here`}
              rows={8}
              required
            />
          </div>
        </>
      );
    } else if (type === 'archive') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter archive item title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe this archive item"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                required
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Supported: Images, videos, audio, PDF, Word documents
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photos">Photos</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="letters">Letters</SelectItem>
                  <SelectItem value="certificates">Certificates</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTaken">Date Taken</Label>
              <Input
                id="dateTaken"
                type="date"
                value={formData.dateTaken}
                onChange={(e) => handleInputChange('dateTaken', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Where was this taken/created?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personRelated">Related Person</Label>
              <Input
                id="personRelated"
                value={formData.personRelated}
                onChange={(e) => handleInputChange('personRelated', e.target.value)}
                placeholder="Family member name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-gray-500">
              E.g: wedding, 1950s, grandparents, vacation
            </p>
          </div>
        </>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={`flex items-center gap-2 ${className}`}>
          {getIcon()}
          {triggerText || `Submit ${getTypeLabel()}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            Submit {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Submit your {getTypeLabel().toLowerCase()} for admin review and approval. 
            Once approved, it will be published on the website.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFormFields()}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionForm;