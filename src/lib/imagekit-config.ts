// ImageKit configuration for client-side uploads
export const IMAGEKIT_CONFIG = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_v55ztaoC88nm6iX6WgSdB2wsdTM=',
  urlEndpoint: 'https://ik.imagekit.io/ptze2wqby/',
  uploadEndpoint: 'https://upload.imagekit.io/api/v1/files/upload'
};

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  size: number;
  versionInfo: {
    id: string;
    name: string;
  };
  filePath: string;
  url: string;
  fileType: string;
  height?: number;
  width?: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface ImageKitAuthParams {
  signature: string;
  expire: number;
  token: string;
}