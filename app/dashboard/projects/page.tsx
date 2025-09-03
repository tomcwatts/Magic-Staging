import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FolderOpen, Image, Calendar, MapPin, Hash } from "lucide-react";

export default async function ProjectsPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  const projects = await db.project.findMany({
    where: {
      organizationId: userWithOrg.organization.id,
    },
    include: {
      _count: {
        select: {
          roomImages: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getPropertyTypeIcon = (type: string | null) => {
    switch (type) {
      case 'house':
        return '🏠';
      case 'condo':
        return '🏢';
      case 'commercial':
        return '🏬';
      default:
        return '🏘️';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your virtual staging projects
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">
              Create your first project to start staging rooms with AI. Each project can contain multiple room images for comprehensive property staging.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg line-clamp-2 flex items-center">
                      <span className="mr-2">
                        {getPropertyTypeIcon(project.propertyType)}
                      </span>
                      {project.name}
                    </CardTitle>
                    {project.address && (
                      <CardDescription className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{project.address}</span>
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={getStatusColor(project.status) as any}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* MLS Number */}
                {project.mlsNumber && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Hash className="mr-1 h-3 w-3" />
                    {project.mlsNumber}
                  </div>
                )}

                {/* Room Images Count */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Image className="mr-1 h-4 w-4" />
                  {project._count.roomImages} room{project._count.roomImages !== 1 ? 's' : ''}
                </div>

                {/* Last Updated */}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  Updated {formatDate(project.updatedAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      View Details
                    </Link>
                  </Button>
                  
                  {project._count.roomImages === 0 ? (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/projects/${project.id}#upload`}>
                        Add Photos
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/projects/${project.id}#staging`}>
                        Start Staging
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}