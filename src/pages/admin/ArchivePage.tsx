import React, { useState } from 'react';
import FileUpload from '@/components/admin/FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Upload, Image, FileText, Video } from 'lucide-react';

const ArchivePage: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Archive Management</h2>
        <p className="text-gray-600">Manage family photos, documents, and historical files</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid gap-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Upload Photos
                </CardTitle>
                <CardDescription>
                  Upload family photos and images to the archive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  folder="photos"
                  accept="image/*"
                  maxFileSize={50}
                  multiple={true}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload historical documents, certificates, and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  folder="documents"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  maxFileSize={25}
                  multiple={true}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Upload Videos
                </CardTitle>
                <CardDescription>
                  Upload family videos and recorded memories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  folder="videos"
                  accept="video/*"
                  maxFileSize={500}
                  multiple={true}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Family Photos</CardTitle>
              <CardDescription>Browse and manage uploaded family photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Photo gallery coming soon</p>
                <p className="text-sm">Upload photos to see them here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Historical Documents</CardTitle>
              <CardDescription>Browse and manage uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Document library coming soon</p>
                <p className="text-sm">Upload documents to see them here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Uploads Summary */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Files uploaded in this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.slice(-5).map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{file.filename}</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArchivePage;