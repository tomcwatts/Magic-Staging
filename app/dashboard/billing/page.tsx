import { requireAuthWithOrg } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { BillingDashboardClient } from '@/components/billing/billing-dashboard-client';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  try {
    const userWithOrg = await requireAuthWithOrg();

    // Get organization with transactions and usage logs
    const organization = await db.organization.findUnique({
      where: { id: userWithOrg.organization.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Get last 50 transactions
        },
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Get last 100 usage logs
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      redirect('/dashboard');
    }

    return (
      <BillingDashboardClient
        organization={organization}
        currentUser={userWithOrg.user}
      />
    );
    
  } catch (error) {
    console.error('Billing page error:', error);
    redirect('/sign-in');
  }
}