"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  CreditCard, 
  Image as ImageIcon,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";

interface ErrorStateProps {
  title: string;
  description?: string;
  type?: "error" | "warning" | "info";
  icon?: "error" | "warning" | "info" | "network" | "payment" | "upload";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ 
  title, 
  description, 
  type = "error",
  icon,
  action,
  className 
}: ErrorStateProps) {
  const iconMap = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    network: WifiOff,
    payment: CreditCard,
    upload: ImageIcon,
  };

  const IconComponent = icon ? iconMap[icon] : iconMap[type];
  
  const colorMap = {
    error: "text-red-500",
    warning: "text-orange-500", 
    info: "text-blue-500",
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <IconComponent className={cn("h-12 w-12 mb-4", colorMap[type])} />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-6">
            {description}
          </p>
        )}

        {action && (
          <Button onClick={action.onClick} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface InlineErrorProps {
  message: string;
  type?: "error" | "warning" | "info";
  className?: string;
}

export function InlineError({ message, type = "error", className }: InlineErrorProps) {
  const variants = {
    error: "destructive" as const,
    warning: "default" as const,
    info: "default" as const,
  };

  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const IconComponent = icons[type];

  return (
    <Alert variant={variants[type]} className={cn("", className)}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorState
      title="Connection Problem"
      description="Please check your internet connection and try again."
      type="error"
      icon="network"
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      className={className}
    />
  );
}

interface UploadErrorProps {
  errors: string[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function UploadError({ errors, onRetry, onDismiss, className }: UploadErrorProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-red-800">
          <AlertCircle className="mr-2 h-5 w-5" />
          Upload Failed
        </CardTitle>
        <CardDescription className="text-red-700">
          Some files could not be uploaded:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700 mb-4">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} size="sm" variant="ghost">
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PaymentErrorProps {
  error: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function PaymentError({ error, onRetry, onCancel, className }: PaymentErrorProps) {
  return (
    <Alert variant="destructive" className={className}>
      <CreditCard className="h-4 w-4" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{error}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              Try Again
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel} size="sm" variant="ghost">
              Cancel
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface StagingErrorProps {
  error: string;
  creditsRefunded?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function StagingError({ 
  error, 
  creditsRefunded = true, 
  onRetry, 
  className 
}: StagingErrorProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 mb-1">
              AI Staging Failed
            </h4>
            <p className="text-sm text-red-700 mb-3">
              {error}
            </p>
            
            {creditsRefunded && (
              <p className="text-xs text-green-700 mb-3">
                ✓ Your credit has been refunded automatically.
              </p>
            )}
            
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FormFieldError({ error }: { error: string }) {
  return (
    <p className="text-sm text-red-600 mt-1 flex items-center">
      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
      {error}
    </p>
  );
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  action 
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Icon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-4">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}