'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfileImageUploadProps {
  onSuccess: (profile: any) => void;
}

export default function ProfileImageUpload({ onSuccess }: ProfileImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      onSuccess(data.user);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };

  // Handle remove profile picture
  const handleRemove = async () => {
    try {
      setUploading(true);
      setError(null);

      const response = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove image');
      }

      const data = await response.json();
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to remove image');
      console.error('Error removing image:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4">
        {previewUrl && (
          <div className="relative w-24 h-24">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="rounded-full object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedFile || uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
