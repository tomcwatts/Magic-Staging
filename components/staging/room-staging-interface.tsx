"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Wand2, Palette, Home, Clock, DollarSign, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RoomImage {
  id: string;
  filename: string;
  url: string;
  roomType?: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

interface StagingResult {
  success: boolean;
  stagingJobId: string;
  stagedImageUrl?: string;
  processingTime?: number;
  creditsRemaining: number;
  error?: string;
}

interface RoomStagingInterfaceProps {
  roomImages: RoomImage[];
  creditsRemaining: number;
  onStagingComplete?: (result: StagingResult) => void;
}

interface StagingRequest {
  roomImageId: string;
  prompt: string;
  style: 'modern' | 'traditional' | 'minimalist' | 'luxury' | 'contemporary' | 'rustic';
  preferences: {
    colors: string[];
    furnitureCount: 'minimal' | 'moderate' | 'full';
    budget: 'economy' | 'mid_range' | 'luxury';
  };
}

interface StagingJob {
  roomImageId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    stagedImageUrl: string;
    processingTime: number;
  };
  error?: string;
}

const STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean lines, neutral colors, contemporary furniture' },
  { value: 'traditional', label: 'Traditional', description: 'Classic furniture, warm colors, elegant patterns' },
  { value: 'minimalist', label: 'Minimalist', description: 'Few furniture pieces, lots of white space' },
  { value: 'luxury', label: 'Luxury', description: 'High-end furniture, rich materials, premium accessories' },
  { value: 'contemporary', label: 'Contemporary', description: 'Modern and traditional blend, current trends' },
  { value: 'rustic', label: 'Rustic', description: 'Natural wood, warm earth tones, farmhouse style' },
];

const FURNITURE_COUNT = [
  { value: 'minimal', label: 'Minimal', description: 'Essential pieces only' },
  { value: 'moderate', label: 'Moderate', description: 'Comfortable amount' },
  { value: 'full', label: 'Full', description: 'Fully furnished space' },
];

const BUDGETS = [
  { value: 'economy', label: 'Economy', description: 'Affordable, practical choices' },
  { value: 'mid_range', label: 'Mid-Range', description: 'Quality and cost balance' },
  { value: 'luxury', label: 'Luxury', description: 'High-end, designer quality' },
];

export function RoomStagingInterface({ roomImages, creditsRemaining, onStagingComplete }: RoomStagingInterfaceProps) {
  const [selectedImage, setSelectedImage] = useState<RoomImage | null>(null);
  const [stagingRequest, setStagingRequest] = useState<StagingRequest>({
    roomImageId: '',
    prompt: '',
    style: 'modern',
    preferences: {
      colors: [],
      furnitureCount: 'moderate',
      budget: 'mid_range',
    },
  });
  const [colorInput, setColorInput] = useState('');
  const [stagingJobs, setStagingJobs] = useState<Record<string, StagingJob>>({});

  const addColor = () => {
    if (colorInput.trim() && !stagingRequest.preferences.colors.includes(colorInput.trim())) {
      setStagingRequest(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          colors: [...prev.preferences.colors, colorInput.trim()],
        },
      }));
      setColorInput('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    setStagingRequest(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        colors: prev.preferences.colors.filter(color => color !== colorToRemove),
      },
    }));
  };

  const startStaging = async (roomImage: RoomImage) => {
    if (creditsRemaining < 1) {
      toast.error('Insufficient credits. Please purchase more credits to continue.');
      return;
    }

    const jobKey = roomImage.id;
    
    // Update job status to processing
    setStagingJobs(prev => ({
      ...prev,
      [jobKey]: {
        roomImageId: roomImage.id,
        status: 'processing',
      },
    }));

    try {
      const response = await fetch('/api/staging/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomImageId: roomImage.id,
          prompt: stagingRequest.prompt.trim() || undefined,
          style: stagingRequest.style,
          preferences: {
            colors: stagingRequest.preferences.colors.length > 0 ? stagingRequest.preferences.colors : undefined,
            furnitureCount: stagingRequest.preferences.furnitureCount,
            budget: stagingRequest.preferences.budget,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Staging failed');
      }

      const result = await response.json();

      // Update job status to completed
      setStagingJobs(prev => ({
        ...prev,
        [jobKey]: {
          roomImageId: roomImage.id,
          status: 'completed',
          result: {
            stagedImageUrl: result.stagedImageUrl,
            processingTime: result.processingTime,
          },
        },
      }));

      toast.success(`Room staged successfully in ${(result.processingTime / 1000).toFixed(1)}s!`);
      onStagingComplete?.(result);

    } catch (error) {
      console.error('Staging failed:', error);
      
      // Update job status to error
      setStagingJobs(prev => ({
        ...prev,
        [jobKey]: {
          roomImageId: roomImage.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));

      toast.error(error instanceof Error ? error.message : 'Staging failed');
    }
  };

  const getJobStatus = (roomImageId: string) => {
    return stagingJobs[roomImageId];
  };

  return (
    <div className="space-y-6">
      {/* Credits Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                Available Credits
              </CardTitle>
              <CardDescription>
                Each room staging uses 1 credit
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={creditsRemaining > 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
                {creditsRemaining} credits
              </Badge>
              {creditsRemaining <= 3 && (
                <Button asChild size="sm">
                  <Link href="/dashboard/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buy Credits
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Staging Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Staging Configuration
          </CardTitle>
          <CardDescription>
            Configure the style and preferences for virtual staging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Staging Style</Label>
            <Select
              value={stagingRequest.style}
              onValueChange={(value: any) => setStagingRequest(prev => ({ ...prev, style: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-muted-foreground">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Preferences */}
          <div className="space-y-3">
            <Label>Color Preferences (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., navy blue, white, gold"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addColor()}
              />
              <Button type="button" variant="outline" onClick={addColor}>
                Add
              </Button>
            </div>
            {stagingRequest.preferences.colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stagingRequest.preferences.colors.map(color => (
                  <Badge key={color} variant="secondary" className="cursor-pointer" onClick={() => removeColor(color)}>
                    {color} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Furniture Amount */}
          <div className="space-y-3">
            <Label>Furniture Amount</Label>
            <Select
              value={stagingRequest.preferences.furnitureCount}
              onValueChange={(value: any) => setStagingRequest(prev => ({
                ...prev,
                preferences: { ...prev.preferences, furnitureCount: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FURNITURE_COUNT.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Level */}
          <div className="space-y-3">
            <Label>Budget Level</Label>
            <Select
              value={stagingRequest.preferences.budget}
              onValueChange={(value: any) => setStagingRequest(prev => ({
                ...prev,
                preferences: { ...prev.preferences, budget: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGETS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="e.g., Add a dining table for 6 people, include plants, focus on natural lighting..."
              value={stagingRequest.prompt}
              onChange={(e) => setStagingRequest(prev => ({ ...prev, prompt: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Room Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5" />
            Room Images
          </CardTitle>
          <CardDescription>
            Select room images to stage with your configured preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roomImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No room images available. Upload images first.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roomImages.map(roomImage => {
                const jobStatus = getJobStatus(roomImage.id);
                
                return (
                  <Card key={roomImage.id} className="overflow-hidden">
                    <div className="relative aspect-video">
                      <Image
                        src={roomImage.url}
                        alt={roomImage.filename}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Status Overlay */}
                      {jobStatus && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          {jobStatus.status === 'processing' && (
                            <div className="text-white text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Processing...</p>
                            </div>
                          )}
                          {jobStatus.status === 'completed' && (
                            <div className="text-white text-center">
                              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Completed!</p>
                            </div>
                          )}
                          {jobStatus.status === 'error' && (
                            <div className="text-white text-center">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Failed</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm truncate">{roomImage.filename}</p>
                          {roomImage.roomType && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {roomImage.roomType.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        
                        {jobStatus?.result ? (
                          <div className="space-y-2">
                            <p className="text-xs text-green-600 flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              Completed in {(jobStatus.result.processingTime / 1000).toFixed(1)}s
                            </p>
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <Image
                                src={jobStatus.result.stagedImageUrl}
                                alt="Staged room"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : jobStatus?.error ? (
                          <p className="text-xs text-red-600">{jobStatus.error}</p>
                        ) : (
                          <Button
                            onClick={() => startStaging(roomImage)}
                            disabled={creditsRemaining < 1 || jobStatus?.status === 'processing'}
                            className="w-full"
                            size="sm"
                          >
                            {jobStatus?.status === 'processing' ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Staging...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Stage Room (1 credit)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}