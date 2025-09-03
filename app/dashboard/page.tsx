import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Zap, CreditCard, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userWithOrg.user?.name || "there"}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your virtual staging projects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Credits Remaining
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userWithOrg.organization?.creditsRemaining || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              AI staging operations available
            </p>
            {(userWithOrg.organization?.creditsRemaining || 0) <= 5 && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Running low
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Properties being staged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staged Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plan Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="secondary">
                {userWithOrg.organization?.planType || "Individual"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Current subscription
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low credits warning */}
      {(userWithOrg.organization?.creditsRemaining || 0) <= 3 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Running low on credits
                </h3>
                <p className="text-sm text-orange-700">
                  You have {userWithOrg.organization?.creditsRemaining || 0} credits remaining. Purchase more to continue staging rooms.
                </p>
              </div>
              <Button asChild className="ml-4">
                <Link href="/dashboard/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy Credits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your virtual staging projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to transform empty rooms?
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first project and upload room photos to get started with AI virtual staging.
              </p>
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  Create New Project
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:ml-4">
              <Button asChild variant="outline">
                <Link href="/dashboard/billing">
                  <Zap className="mr-2 h-4 w-4" />
                  Buy Credits
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/projects">
                  View All Projects
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}