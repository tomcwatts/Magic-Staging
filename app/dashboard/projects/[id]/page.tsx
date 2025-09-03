import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Hash, 
  Calendar,
  Settings,
  Home,
  Building,
  Building2
} from "lucide-react";

interface ProjectDetailPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  // Await params for Next.js 15
  const { id } = await params;

  // Fetch project with room images and staged images
  const project = await db.project.findFirst({
    where: {
      id: id,
      organizationId: userWithOrg.organization.id,
    },
    include: {
      roomImages: {
        include: {
          stagingJobs: {
            include: {
              stagedImages: true,
            },
            where: {
              status: 'completed',
            },
          },
        },
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

  const PropertyTypeIcon = getPropertyTypeIcon(project.propertyType);
  
  // Calculate staged images count
  const stagedImagesCount = project.roomImages.reduce((total, roomImage) => {
    return total + roomImage.stagingJobs.reduce((jobTotal, job) => {
      return jobTotal + job.stagedImages.length;
    }, 0);
  }, 0);

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
              <div className="text-2xl font-bold text-green-600">{stagedImagesCount}</div>
              <div className="text-sm text-muted-foreground">Staged Images</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{new Set(project.roomImages.map(img => img.roomType || 'unspecified')).size}</div>
              <div className="text-sm text-muted-foreground">Room Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <ProjectDetailClient 
        project={{
          ...project,
          stagedImagesCount,
        }}
        creditsRemaining={userWithOrg.organization.creditsRemaining}
      />
    </div>
  );
}