"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Home, Building, Building2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  address?: string | null;
  mlsNumber?: string | null;
  propertyType?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProjectFormProps {
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
}

interface ProjectFormData {
  name: string;
  address: string;
  mlsNumber: string;
  propertyType: 'house' | 'condo' | 'commercial' | '';
  description: string;
}

const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condominium', icon: Building },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
];

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    address: '',
    mlsNumber: '',
    propertyType: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          mlsNumber: formData.mlsNumber.trim() || undefined,
          propertyType: formData.propertyType || undefined,
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const result: { project: Project } = await response.json();
      
      toast.success('Project created successfully!');
      
      if (onSuccess) {
        onSuccess(result.project);
      } else {
        // Navigate to the new project
        router.push(`/dashboard/projects/${result.project.id}`);
      }

    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>
          Start a new virtual staging project for a property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., 123 Main Street Living Room"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Property Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Property Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="e.g., 123 Main Street, Anytown, ST 12345"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* MLS Number */}
          <div className="space-y-2">
            <Label htmlFor="mlsNumber">MLS Number</Label>
            <Input
              id="mlsNumber"
              type="text"
              placeholder="e.g., MLS123456"
              value={formData.mlsNumber}
              onChange={(e) => handleInputChange('mlsNumber', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label>Property Type</Label>
            <Select 
              value={formData.propertyType} 
              onValueChange={(value) => handleInputChange('propertyType', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this project..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}