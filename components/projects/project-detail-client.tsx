"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiFileUpload } from "@/components/upload/multi-file-upload";
import { RoomStagingInterface } from "@/components/staging/room-staging-interface";
import Link from "next/link";
import { 
  Upload,
  Image as ImageIcon,
  Wand2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar
} from "lucide-react";
import Image from "next/image";

interface StagedImage {
  id: string;
  s3Url: string;
  createdAt: Date;
  isApproved: boolean;
}

interface StagingJob {
  id: string;
  status: string;
  stylePreferences: any;
  createdAt: Date;
  stagedImages: StagedImage[];
}

interface RoomImage {
  id: string;
  filename: string;
  s3Url: string;
  roomType?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadStatus: string;
  createdAt: Date;
  stagingJobs: StagingJob[];
}

interface ProjectDetailClientProps {
  project: {
    id: string;
    name: string;
    roomImages: RoomImage[];
    stagedImagesCount: number;
  };
  creditsRemaining: number;
}

export function ProjectDetailClient({ project, creditsRemaining }: ProjectDetailClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Refresh the component to show new uploads
    setRefreshKey(prev => prev + 1);
    // Also refresh the page to get latest data from server
    window.location.reload();
  };

  const handleStagingComplete = () => {
    // Refresh the page to show updated credits and staged images
    window.location.reload();
  };

  const groupImagesByRoomType = (images: RoomImage[]) => {
    const grouped = images.reduce((acc, image) => {
      const roomType = image.roomType || 'unspecified';
      if (!acc[roomType]) {
        acc[roomType] = [];
      }
      acc[roomType].push(image);
      return acc;
    }, {} as Record<string, RoomImage[]>);
    
    return grouped;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const groupedImages = groupImagesByRoomType(project.roomImages);
  const roomTypes = Object.keys(groupedImages);

  return (
    <Tabs defaultValue="upload" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="upload" className="flex items-center">
          <Upload className="mr-2 h-4 w-4" />
          Upload Images
        </TabsTrigger>
        <TabsTrigger value="gallery" className="flex items-center">
          <ImageIcon className="mr-2 h-4 w-4" />
          Image Gallery
        </TabsTrigger>
        <TabsTrigger value="staging" className="flex items-center">
          <Wand2 className="mr-2 h-4 w-4" />
          AI Staging
        </TabsTrigger>
        <TabsTrigger value="staged" className="flex items-center">
          <CheckCircle className="mr-2 h-4 w-4" />
          Staged Images
        </TabsTrigger>
      </TabsList>

      {/* Upload Tab */}
      <TabsContent value="upload" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Room Images</CardTitle>
            <CardDescription>
              Upload high-quality images of empty or furnished rooms for virtual staging.
              The AI works best with well-lit, wide-angle shots that show the entire room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiFileUpload 
              key={refreshKey}
              projectId={project.id}
              onUploadComplete={handleUploadComplete}
              maxFiles={20}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Gallery Tab */}
      <TabsContent value="gallery" className="space-y-6">
        {project.roomImages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No images uploaded yet
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Upload room images to get started with virtual staging
              </p>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {roomTypes.map(roomType => (
              <Card key={roomType}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {roomType === 'unspecified' ? 'Unspecified Rooms' : roomType.replace('_', ' ')}
                  </CardTitle>
                  <CardDescription>
                    {groupedImages[roomType].length} image{groupedImages[roomType].length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupedImages[roomType].map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="relative aspect-video">
                          <Image
                            src={image.s3Url}
                            alt={image.filename}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <Button
                              size="sm"
                              className="opacity-0 hover:opacity-100 transition-opacity"
                              asChild
                            >
                              <Link href={`#staging`}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Stage Room
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate">{image.filename}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{image.fileSize ? (image.fileSize / 1024 / 1024).toFixed(1) : '0'} MB</span>
                              {image.width && image.height && (
                                <span>{image.width}×{image.height}</span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(new Date(image.createdAt))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* AI Staging Tab */}
      <TabsContent value="staging" className="space-y-6">
        {project.roomImages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wand2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload room images first
              </h3>
              <p className="text-gray-600 text-center mb-4">
                You need to upload room images before you can start staging
              </p>
              <Button asChild>
                <Link href="#upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <RoomStagingInterface 
            roomImages={project.roomImages.map(image => ({
              id: image.id,
              filename: image.filename,
              url: image.s3Url,
              roomType: image.roomType,
              width: image.width,
              height: image.height,
              fileSize: image.fileSize,
            }))}
            creditsRemaining={creditsRemaining}
            onStagingComplete={handleStagingComplete}
          />
        )}
      </TabsContent>

      {/* Staged Images Tab */}
      <TabsContent value="staged" className="space-y-6">
        {project.stagedImagesCount === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No staged images yet
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Upload room images and use AI staging to see results here
              </p>
              <Button asChild>
                <Link href="#staging">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Start Staging
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {project.roomImages.map((roomImage) => 
              roomImage.stagingJobs
                .filter(job => job.status === 'completed' && job.stagedImages.length > 0)
                .map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Staged: {roomImage.filename}
                      </CardTitle>
                      <CardDescription>
                        Style: {job.stylePreferences?.style || 'modern'} • 
                        Created {formatDate(new Date(job.createdAt))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Original Image */}
                        <div>
                          <h4 className="font-medium mb-3">Original</h4>
                          <div className="relative aspect-video">
                            <Image
                              src={roomImage.s3Url}
                              alt={`Original ${roomImage.filename}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        </div>
                        
                        {/* Staged Images */}
                        <div>
                          <h4 className="font-medium mb-3">AI Staged</h4>
                          <div className="space-y-4">
                            {job.stagedImages.map((stagedImage) => (
                              <div key={stagedImage.id} className="relative aspect-video">
                                <Image
                                  src={stagedImage.s3Url}
                                  alt="Staged room"
                                  fill
                                  className="object-cover rounded-lg"
                                />
                                {stagedImage.isApproved && (
                                  <Badge className="absolute top-2 right-2 bg-green-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Approved
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}