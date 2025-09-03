"use client";

import { cn } from "@/lib/utils";
import { Loader2, Wand2, Upload, CreditCard, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
    />
  );
}

interface LoadingStateProps {
  title: string;
  description?: string;
  icon?: "upload" | "staging" | "payment" | "image" | "spinner";
  progress?: number;
  className?: string;
}

export function LoadingState({ 
  title, 
  description, 
  icon = "spinner", 
  progress,
  className 
}: LoadingStateProps) {
  const IconComponent = {
    upload: Upload,
    staging: Wand2,
    payment: CreditCard,
    image: ImageIcon,
    spinner: LoadingSpinner,
  }[icon];

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 text-blue-500">
          {icon === "spinner" ? (
            <LoadingSpinner size="lg" />
          ) : (
            <IconComponent className="h-12 w-12 animate-pulse" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 text-center mb-4">
            {description}
          </p>
        )}

        {typeof progress === "number" && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
        
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1.4s"
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InlineLoading({ 
  text = "Loading...", 
  size = "sm" 
}: { 
  text?: string; 
  size?: "sm" | "md" 
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function ButtonLoading({ 
  text = "Loading...", 
  size = "sm" 
}: { 
  text?: string; 
  size?: "sm" | "md" 
}) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size={size} />
      <span>{text}</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-200",
        variantClasses[variant],
        className
      )}
    />
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-gray-200 rounded-lg", className)}>
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-4" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}