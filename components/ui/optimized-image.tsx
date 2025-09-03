"use client";

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { ImageSkeleton } from './loading-states';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  skeletonClassName?: string;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showSkeleton = true,
  skeletonClassName,
  onLoadComplete,
  onError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoadComplete?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    const errorObj = new Error(`Failed to load image: ${currentSrc}`);
    setError(errorObj);
    onError?.(errorObj);
    
    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setError(null);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {isLoading && showSkeleton && (
        <ImageSkeleton className={cn("absolute inset-0", skeletonClassName)} />
      )}
      
      <Image
        {...props}
        src={currentSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
      
      {error && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  return (
    <OptimizedImage
      {...props}
      loading="lazy"
    />
  );
}

interface GalleryImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
}

export function GalleryImage({ 
  lowQualitySrc, 
  src, 
  ...props 
}: GalleryImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);
  const [highQualityLoaded, setHighQualityLoaded] = useState(!lowQualitySrc);

  const handleLowQualityLoad = () => {
    if (lowQualitySrc && !highQualityLoaded) {
      // Start loading high quality image
      const img = new window.Image();
      img.src = typeof src === 'string' ? src : '';
      img.onload = () => {
        setCurrentSrc(src);
        setHighQualityLoaded(true);
      };
    }
  };

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      onLoadComplete={lowQualitySrc ? handleLowQualityLoad : props.onLoadComplete}
      className={cn(
        !highQualityLoaded && lowQualitySrc && "filter blur-sm",
        "transition-all duration-300",
        props.className
      )}
    />
  );
}