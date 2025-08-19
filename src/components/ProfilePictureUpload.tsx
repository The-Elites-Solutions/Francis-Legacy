import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { 
  type Crop, 
  type PixelCrop, 
  centerCrop, 
  makeAspectCrop 
} from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera, X, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureUploadProps {
  currentPhotoUrl?: string;
  userName: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
  isAdminMode?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPhotoUrl,
  userName,
  onPhotoUpdate,
  isAdminMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef('');

  // Function to get initials for fallback avatar
  const getInitials = () => {
    const names = userName.split(' ');
    return names.map(name => name.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  // Handle file selection
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(file);
    }
  };

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a 1:1 aspect ratio crop centered in the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 50,
        },
        1, // 1:1 aspect ratio
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
  };

  // Generate canvas preview of the cropped image
  const generateCanvas = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      );
    },
    [],
  );

  // Update preview canvas when crop changes
  React.useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      generateCanvas(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop, generateCanvas]);

  // Convert canvas to blob and upload
  const handleUpload = async () => {
    if (!previewCanvasRef.current || !completedCrop) {
      alert('Please select and crop an image first');
      return;
    }

    setUploading(true);

    try {
      // Convert canvas to blob
      previewCanvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        // Create file from blob
        const file = new File([blob], `profile-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Upload to ImageKit in 'profiles' folder
        const uploadResult = await apiClient.uploadFile(file, 'profiles');

        // Update profile with new photo URL (only for family members editing themselves)
        if (!isAdminMode) {
          await apiClient.updateOwnProfile({
            profilePhotoUrl: uploadResult.file.location,
          });
        }

        // Notify parent component
        onPhotoUpdate(uploadResult.file.location);

        // Close dialog and reset state
        setIsOpen(false);
        setImgSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Reset state when dialog closes
  const handleDialogClose = () => {
    setIsOpen(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="w-24 h-24 border-4 border-yellow-400/50 hover:border-yellow-400/80 transition-all duration-200">
            <AvatarImage src={currentPhotoUrl} alt={userName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-900 font-semibold text-lg">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg group-hover:bg-yellow-600 transition-colors duration-200">
            <Upload className="w-3 h-3" />
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Upload and crop your profile picture to a 1:1 ratio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label htmlFor="profile-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
              </div>
              <input
                id="profile-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onSelectFile}
              />
            </label>
          </div>

          {/* Image Cropping Area */}
          {imgSrc && (
            <div className="space-y-4">
              <div className="max-h-96 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imgSrc}
                    style={{ transform: 'scale(1) rotate(0deg)' }}
                    onLoad={onImageLoad}
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
              </div>

              {/* Preview Canvas (hidden) */}
              <canvas
                ref={previewCanvasRef}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleDialogClose} disabled={uploading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {imgSrc && (
              <Button onClick={handleUpload} disabled={uploading || !completedCrop}>
                <Check className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Save Picture'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureUpload;