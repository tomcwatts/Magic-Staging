import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "@/components/projects/create-project-form";

export default async function NewProjectPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Start a new virtual staging project for your property
        </p>
      </div>

      <CreateProjectForm />
    </div>
  );
}