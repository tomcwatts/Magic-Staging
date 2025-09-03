"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditPackage, BASE_PRICE_PER_CREDIT } from "@/lib/pricing";
import { Zap, Star } from "lucide-react";

interface CreditPurchaseCardProps {
  creditPackage: CreditPackage;
  onSelect: (packageId: string) => void;
  isLoading?: boolean;
  isSelected?: boolean;
}

export function CreditPurchaseCard({ 
  creditPackage, 
  onSelect, 
  isLoading = false,
  isSelected = false 
}: CreditPurchaseCardProps) {
  const savingsPercentage = Math.round((creditPackage.savings / (BASE_PRICE_PER_CREDIT * creditPackage.credits)) * 100);

  return (
    <Card className={`relative transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-blue-500 border-blue-500' 
        : 'hover:shadow-lg cursor-pointer'
    } ${creditPackage.isPopular ? 'border-orange-500' : ''}`}>
      {creditPackage.isPopular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600">
          <Star className="mr-1 h-3 w-3 fill-current" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center">
          <Zap className="mr-2 h-5 w-5 text-blue-500" />
          {creditPackage.credits} Credits
        </CardTitle>
        <CardDescription>
          AI staging operations
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Pricing */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              ${creditPackage.totalPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              ${creditPackage.pricePerCredit.toFixed(2)} per credit
            </div>
          </div>

          {/* Savings */}
          {creditPackage.savings > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Save ${creditPackage.savings.toFixed(2)} ({savingsPercentage}%)
              </Badge>
            </div>
          )}

          {/* Original price comparison */}
          {creditPackage.savings > 0 && (
            <div className="text-center text-sm text-gray-500">
              <span className="line-through">
                ${(BASE_PRICE_PER_CREDIT * creditPackage.credits).toFixed(2)}
              </span>
              {' regular price'}
            </div>
          )}

          {/* Purchase button */}
          <Button
            className="w-full"
            onClick={() => onSelect(creditPackage.id)}
            disabled={isLoading}
            variant={creditPackage.isPopular ? "default" : "outline"}
            size="lg"
          >
            {isLoading ? "Processing..." : "Select Package"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}