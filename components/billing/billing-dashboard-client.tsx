"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CreditPurchaseInterface } from '@/components/payments/credit-purchase-interface';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Transaction {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  roomsPurchased: number; // This represents credits
  description: string | null;
  createdAt: Date;
}

interface UsageLog {
  id: string;
  action: string;
  billableCredits: number;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  } | null;
}

interface Organization {
  id: string;
  name: string;
  creditsRemaining: number;
  planType: string;
  transactions: Transaction[];
  usageLogs: UsageLog[];
}

interface BillingDashboardClientProps {
  organization: Organization;
  currentUser: {
    id: string;
    name?: string | null;
    email: string;
  };
}

export function BillingDashboardClient({ 
  organization 
}: BillingDashboardClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePurchaseComplete = () => {
    // Refresh the page to show updated credits and transactions
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'room_staged':
        return 'AI Staging';
      case 'credits_purchased':
        return 'Credits Added';
      default:
        return action.replace('_', ' ');
    }
  };

  // Calculate totals
  const totalSpent = organization.transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amountCents, 0);

  const totalCreditsUsed = organization.usageLogs
    .filter(log => log.billableCredits > 0)
    .reduce((sum, log) => sum + log.billableCredits, 0);

  const totalCreditsPurchased = organization.transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.roomsPurchased, 0);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground">
          Manage your credits and view transaction history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {organization.creditsRemaining}
            </div>
            <p className="text-xs text-muted-foreground">
              AI staging operations available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              Total staging operations performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Purchased</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsPurchased}</div>
            <p className="text-xs text-muted-foreground">
              Total credits added to account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime spending on credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="purchase" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase">Buy Credits</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <CreditPurchaseInterface
            key={refreshKey}
            currentCredits={organization.creditsRemaining}
            onPurchaseComplete={handlePurchaseComplete}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All credit purchases and payment attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization.transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 mb-4" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Purchase your first credit package to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDistance(new Date(transaction.createdAt), new Date(), { 
                              addSuffix: true 
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.description || 'Credit purchase'}
                        </TableCell>
                        <TableCell>
                          {transaction.roomsPurchased > 0 ? (
                            <div className="flex items-center">
                              <Zap className="mr-1 h-3 w-3 text-blue-500" />
                              +{transaction.roomsPurchased}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amountCents)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>
                Track how your credits have been used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization.usageLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="mx-auto h-12 w-12 mb-4" />
                  <p>No usage history yet</p>
                  <p className="text-sm">Start staging rooms to see your activity here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDistance(new Date(log.createdAt), new Date(), { 
                              addSuffix: true 
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionLabel(log.action)}
                        </TableCell>
                        <TableCell>
                          {log.user?.name || log.user?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {log.billableCredits > 0 ? (
                            <div className="flex items-center text-red-600">
                              <Zap className="mr-1 h-3 w-3" />
                              -{log.billableCredits}
                            </div>
                          ) : log.billableCredits < 0 ? (
                            <div className="flex items-center text-green-600">
                              <Zap className="mr-1 h-3 w-3" />
                              +{Math.abs(log.billableCredits)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}