import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Music,
  User as UserIcon,
  Video,
  File as FileIcon,
  Archive as ArchiveIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ArchiveItem {
  id: string;
  title: string;
  description?: string;
  file_type: string;
  file_size?: number;
  category?: string;
  tags?: string[];
  date_taken?: string;
  archive_date?: string;
  location?: string;
  person_related?: string;
  file_url: string;
  uploaded_by_name?: string;
  created_at?: string;
}

const isImage = (t: string) =>
  /image|photo|png|jpg|jpeg|gif|webp|svg/i.test(t || '');
const isVideo = (t: string) => /video|mp4|avi|mov|webm/i.test(t || '');
const isAudio = (t: string) => /audio|mp3|wav|music|ogg/i.test(t || '');

const getTypeIcon = (type: string) => {
  if (isImage(type)) return ImageIcon;
  if (isVideo(type)) return Video;
  if (isAudio(type)) return Music;
  if (/pdf|document|text|docx|doc/i.test(type)) return FileText;
  if (/zip|rar|tar/i.test(type)) return ArchiveIcon;
  return FileIcon;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchArchive = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const response = await apiClient.getArchiveById(id);
        if (!cancelled) setItem(response.data as ArchiveItem);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load archive';
        if (/404|not found/i.test(message)) {
          setNotFound(true);
        } else {
          setError(message);
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchArchive();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const handleDownload = async () => {
    if (!item) return;
    try {
      // Prefer direct file_url, fall back to signed URL endpoint
      if (item.file_url) {
        const link = document.createElement('a');
        link.href = item.file_url;
        link.download = item.title || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await apiClient.getArchiveDownloadUrl(item.id);
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = item.title || response.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({
        title: 'Download Started',
        description: `Downloading ${item.title}`,
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
          <p className="mt-2 text-gray-600">Loading archive item...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-16 h-16 mx-auto text-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Archive item not found
          </h1>
          <p className="text-foreground/60 mb-6">
            The archive item you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="gold-texture text-white hover:opacity-90">
            <Link to="/archives">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Archives
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={() => navigate('/archives')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Archives
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const TypeIcon = getTypeIcon(item.file_type);
  const dateDisplay = item.archive_date || item.date_taken;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="text-yellow-600 hover:text-primary">
            <Link to="/archives">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Archives
            </Link>
          </Button>
        </div>

        <Card className="bg-white shadow-md border-primary/30">
          {/* File preview */}
          <div className="w-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-t-lg overflow-hidden">
            {isImage(item.file_type) ? (
              <img
                src={item.file_url}
                alt={item.title}
                className="w-full max-h-[600px] object-contain mx-auto"
              />
            ) : isVideo(item.file_type) ? (
              <video
                controls
                src={item.file_url}
                className="w-full max-h-[600px] mx-auto"
              >
                Your browser does not support the video tag.
              </video>
            ) : isAudio(item.file_type) ? (
              <div className="p-12 flex flex-col items-center">
                <div className="bg-white/80 rounded-full p-8 shadow-lg mb-6">
                  <Music className="w-24 h-24 text-yellow-600" />
                </div>
                <audio controls src={item.file_url} className="w-full max-w-md">
                  Your browser does not support the audio tag.
                </audio>
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center">
                <div className="bg-white/80 rounded-full p-8 shadow-lg mb-6">
                  <TypeIcon className="w-24 h-24 text-yellow-600" />
                </div>
                <Button
                  onClick={handleDownload}
                  className="gold-texture text-white hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>

          <CardContent className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              {item.category && (
                <Badge variant="outline" className="border-primary/30 text-yellow-600">
                  {item.category}
                </Badge>
              )}
              {item.file_size !== undefined && (
                <span className="text-sm text-foreground/60">
                  {formatFileSize(item.file_size)}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {item.title}
            </h1>

            {item.description && (
              <p className="text-foreground/80 mb-6 whitespace-pre-line">
                {item.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-primary/20">
              {dateDisplay && (
                <div className="flex items-center text-sm text-foreground/80">
                  <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-yellow-600 mr-2">Date:</span>
                  {new Date(dateDisplay).toLocaleDateString()}
                </div>
              )}
              {item.location && (
                <div className="flex items-center text-sm text-foreground/80">
                  <MapPin className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-yellow-600 mr-2">Location:</span>
                  {item.location}
                </div>
              )}
              {item.person_related && (
                <div className="flex items-center text-sm text-foreground/80">
                  <UserIcon className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-yellow-600 mr-2">Person:</span>
                  {item.person_related}
                </div>
              )}
              {item.uploaded_by_name && (
                <div className="flex items-center text-sm text-foreground/60">
                  Uploaded by {item.uploaded_by_name}
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/10 text-yellow-600"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownload}
                className="gold-texture text-white hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="border-primary/30 text-yellow-600 hover:bg-primary/5"
                onClick={() => window.open(item.file_url, '_blank')}
              >
                Open in new tab
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
