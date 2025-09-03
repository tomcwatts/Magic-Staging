"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { UploadError } from "@/components/ui/error-states";
import { ImageSkeleton } from "@/components/ui/loading-states";

export interface UploadedFile {
  id?: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: {
    id: string;
    url: string;
    filename: string;
    size: number;
    width?: number;
    height?: number;
  };
}

export interface UploadResult {
  success: boolean;
  uploaded: Array<{
    id: string;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    roomType?: string;
  }>;
  errors?: string[];
  counts: {
    successful: number;
    failed: number;
    total: number;
  };
}

interface MultiFileUploadProps {
  projectId: string;
  onUploadComplete?: (results: UploadResult) => void;
  onUploadStart?: () => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ROOM_TYPES = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

export function MultiFileUpload({
  projectId,
  onUploadComplete,
  onUploadStart,
  maxFiles = 10,
  disabled = false,
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [roomType, setRoomType] = useState<string>('');

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      // Mark all files as uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 0 })));

      // Prepare form data
      const formData = new FormData();
      formData.append('projectId', projectId);
      if (roomType && roomType !== 'unspecified') {
        formData.append('roomType', roomType);
      }

      files.forEach(fileItem => {
        formData.append('files', fileItem.file);
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => ({
          ...f,
          progress: f.status === 'uploading' ? Math.min(f.progress + Math.random() * 30, 90) : f.progress
        })));
      }, 200);

      // Upload files
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result: UploadResult = await response.json();

      // Update file statuses based on results
      setFiles(prev => prev.map(fileItem => {
        const uploaded = result.uploaded.find(u => u.originalName === fileItem.file.name);
        
        if (uploaded) {
          return {
            ...fileItem,
            status: 'completed' as const,
            progress: 100,
            result: {
              id: uploaded.id,
              url: uploaded.url,
              filename: uploaded.filename,
              size: uploaded.size,
              width: uploaded.width,
              height: uploaded.height,
            },
          };
        } else {
          const error = result.errors?.find(e => e.startsWith(fileItem.file.name));
          return {
            ...fileItem,
            status: 'error' as const,
            progress: 0,
            error: error || 'Upload failed',
          };
        }
      }));

      // Show results with better feedback
      if (result.success && result.counts.failed === 0) {
        toast.success(
          `Successfully uploaded ${result.counts.successful} ${result.counts.successful === 1 ? 'file' : 'files'}`
        );
        onUploadComplete?.(result);
      } else if (result.success && result.counts.failed > 0) {
        toast.success(
          `Uploaded ${result.counts.successful} files successfully`
        );
        toast.error(
          `${result.counts.failed} files failed to upload`
        );
        onUploadComplete?.(result);
      } else {
        toast.error('All uploads failed');
      }

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Mark all files as error
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error' as const,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      })));

      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;

    const remainingSlots = maxFiles - files.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length < acceptedFiles.length) {
      toast.warning(`Only ${remainingSlots} more files can be added (max ${maxFiles} total)`);
    }

    const newFiles: UploadedFile[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, disabled]);

  const removeFile = (index: number) => {
    if (disabled || isUploading) return;
    
    setFiles(prev => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      URL.revokeObjectURL(removed.preview);
      return updated;
    });
  };

  const clearAllFiles = () => {
    if (disabled || isUploading) return;
    
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || isUploading || files.length >= maxFiles,
  });

  const canUpload = files.length > 0 && !isUploading;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Room Type Selection */}
      <div className="space-y-2">
        <Label>Room Type (Optional)</Label>
        <Select value={roomType} onValueChange={setRoomType} disabled={disabled || isUploading}>
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unspecified">No specific type</SelectItem>
            {ROOM_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload Room Images</span>
            {files.length > 0 && (
              <Badge variant="secondary">
                {files.length}/{maxFiles} files
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${
              disabled || isUploading || files.length >= maxFiles
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? 'Drop room images here...'
                  : files.length >= maxFiles
                  ? `Maximum ${maxFiles} files reached`
                  : 'Upload room images'}
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop images, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, WebP • Max 10MB per file • Up to {maxFiles} files
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Selected Files</CardTitle>
              <div className="flex items-center space-x-2">
                {completedCount > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {completedCount} completed
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    {errorCount} failed
                  </Badge>
                )}
                {!isUploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFiles}
                    disabled={disabled}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((fileItem, index) => (
                <div key={index} className="relative">
                  <Card className="overflow-hidden">
                    <div className="relative aspect-video">
                      <Image
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Status Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {fileItem.status === 'uploading' && (
                          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </div>
                        )}
                        {fileItem.status === 'completed' && (
                          <div className="bg-green-500 text-white px-2 py-1 rounded flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </div>
                        )}
                        {fileItem.status === 'error' && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Failed
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      {!isUploading && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFile(index)}
                          disabled={disabled}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <p className="font-medium text-sm truncate">{fileItem.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        
                        {fileItem.status === 'uploading' && (
                          <Progress value={fileItem.progress} className="h-1" />
                        )}
                        
                        {fileItem.status === 'error' && fileItem.error && (
                          <p className="text-xs text-red-500 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {fileItem.error}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={uploadFiles}
            disabled={!canUpload || disabled}
            size="lg"
            className="min-w-[200px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading {files.length} files...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Upload {files.length} files
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}