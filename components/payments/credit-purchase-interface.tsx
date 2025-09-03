"use client";

import { useState } from 'react';
import { CREDIT_PACKAGES, type CreditPackage } from '@/lib/pricing';
import { CreditPurchaseCard } from './credit-purchase-card';
import { StripePaymentForm } from './stripe-payment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap } from 'lucide-react';

interface CreditPurchaseInterfaceProps {
  currentCredits: number;
  onPurchaseComplete: () => void;
}

export function CreditPurchaseInterface({ 
  currentCredits, 
  onPurchaseComplete 
}: CreditPurchaseInterfaceProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePackageSelect = (packageId: string) => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
    }
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(false);
    setSelectedPackage(null);
    onPurchaseComplete();
  };

  const handleCancel = () => {
    setSelectedPackage(null);
    setIsProcessing(false);
  };

  if (selectedPackage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Button>
        </div>
        
        <StripePaymentForm
          creditPackage={selectedPackage}
          onSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current credits display */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Zap className="mr-2 h-5 w-5 text-blue-500" />
            Current Balance
          </CardTitle>
          <CardDescription>
            AI staging credits available
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {currentCredits}
          </div>
          <div className="text-sm text-gray-600">
            credits remaining
          </div>
          {currentCredits <= 5 && (
            <Badge variant="destructive" className="mt-2">
              Running low on credits
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Credit packages */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Credit Package</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <CreditPurchaseCard
              key={pkg.id}
              creditPackage={pkg}
              onSelect={handlePackageSelect}
              isLoading={isProcessing}
            />
          ))}
        </div>
      </div>

      {/* Pricing information */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-medium text-gray-900">How it works</h4>
            <p className="text-sm text-gray-600">
              Each credit allows you to generate one AI-staged version of your room image.
              You can stage the same room multiple times with different styles and preferences.
            </p>
            <div className="flex justify-center items-center text-xs text-gray-500 mt-4">
              <div className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                1 Credit = 1 AI Staging Operation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}