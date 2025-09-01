import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user || null;
  } catch {
    return null;
  }
}

export async function getCurrentUserWithOrg() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orgMember = await db.organizationMember.findFirst({
    where: { userId: user.id },
    include: {
      organization: true,
    },
  });

  return {
    user,
    organization: orgMember?.organization || null,
    role: orgMember?.role || null,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireAuthWithOrg() {
  const userWithOrg = await getCurrentUserWithOrg();
  if (!userWithOrg?.user) {
    throw new Error("Authentication required");
  }
  if (!userWithOrg.organization) {
    throw new Error("Organization membership required");
  }
  return userWithOrg;
}