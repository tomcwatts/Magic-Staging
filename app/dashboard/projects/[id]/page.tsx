import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiFileUpload } from "@/components/upload/multi-file-upload";
import { RoomStagingInterface } from "@/components/staging/room-staging-interface";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Hash, 
  Calendar,
  Upload,
  Image as ImageIcon,
  Wand2,
  Settings,
  Home,
  Building,
  Building2
} from "lucide-react";
import Image from "next/image";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  // Fetch project with room images
  const project = await db.project.findFirst({
    where: {
      id: params.id,
      organizationId: userWithOrg.organization.id,
    },
    include: {
      roomImages: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getPropertyTypeIcon = (type: string | null) => {
    switch (type) {
      case 'house':
        return Home;
      case 'condo':
        return Building;
      case 'commercial':
        return Building2;
      default:
        return Home;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'default';
    }
  };

  const groupImagesByRoomType = (images: typeof project.roomImages) => {
    const grouped = images.reduce((acc, image) => {
      const roomType = image.roomType || 'unspecified';
      if (!acc[roomType]) {
        acc[roomType] = [];
      }
      acc[roomType].push(image);
      return acc;
    }, {} as Record<string, typeof images>);
    
    return grouped;
  };

  const PropertyTypeIcon = getPropertyTypeIcon(project.propertyType);
  const groupedImages = groupImagesByRoomType(project.roomImages);
  const roomTypes = Object.keys(groupedImages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          <Badge variant={getStatusColor(project.status) as any}>
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <PropertyTypeIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1 space-y-2">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {project.address && (
                  <div className="flex items-center">
                    <MapPin className="mr-1 h-4 w-4" />
                    {project.address}
                  </div>
                )}
                {project.mlsNumber && (
                  <div className="flex items-center">
                    <Hash className="mr-1 h-4 w-4" />
                    {project.mlsNumber}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Created {formatDate(project.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{project.roomImages.length}</div>
              <div className="text-sm text-muted-foreground">Room Images</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">Staged Images</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{roomTypes.length}</div>
              <div className="text-sm text-muted-foreground">Room Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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
                projectId={project.id}
                onUploadComplete={(results) => {
                  // Refresh the page to show new uploads
                  window.location.reload();
                }}
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
                                <span>{(image.fileSize! / 1024 / 1024).toFixed(1)} MB</span>
                                {image.width && image.height && (
                                  <span>{image.width}×{image.height}</span>
                                )}
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
              creditsRemaining={userWithOrg.organization.creditsRemaining}
              onStagingComplete={(result) => {
                // Refresh page to show updated credits
                window.location.reload();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}