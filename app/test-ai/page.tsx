"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface TestResult {
  success: boolean;
  originalImage?: string;
  analysis?: string;
  error?: string;
  processingTime?: number;
}

export default function TestAIPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', prompt);
      formData.append('style', style);

      const response = await fetch('/api/test-staging', {
        method: 'POST',
        body: formData,
      });

      const data: TestResult = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(`AI analysis completed in ${data.processingTime}ms`);
      } else {
        toast.error(data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error("Failed to test AI staging");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🧪 AI Staging Validation Test</h1>
          <p className="text-muted-foreground mt-2">
            Test Gemini 2.5 Flash with room images to validate the AI model
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload and Config */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Configuration</CardTitle>
              <CardDescription>
                Upload a room image and configure staging preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image">Room Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Preview */}
                {preview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label htmlFor="style">Staging Style</Label>
                  <Select value={style} onValueChange={setStyle} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Add a dining table for 6 people, use blue accent colors..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isLoading || !selectedFile}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing AI Model...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Test AI Staging
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                AI analysis and validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Processing with Gemini AI...</span>
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-green-600">
                        <span className="font-semibold">✅ AI Analysis Successful!</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Processing Time: {result.processingTime}ms
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm">
                          🎉 <strong>Great news!</strong> The AI model successfully analyzed your room image. 
                          Check the server console/logs to see the detailed staging recommendations.
                        </p>
                      </div>
                      
                      {result.originalImage && (
                        <div className="space-y-2">
                          <Label>Uploaded Image:</Label>
                          <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                            <Image
                              src={result.originalImage}
                              alt="Uploaded room"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center text-red-600">
                        <span className="font-semibold">❌ AI Analysis Failed</span>
                      </div>
                      
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {result.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Upload an image and click "Test AI Staging" to validate the AI model
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Validation Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="font-medium">AI Model Works</p>
                  <p className="text-sm text-muted-foreground">Gemini can analyze room images</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✅</span>
                <div>
                  <p className="font-medium">Reasonable Staging Ideas</p>
                  <p className="text-sm text-muted-foreground">Suggestions are practical and useful</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🔄</span>
                <div>
                  <p className="font-medium">Response Time</p>
                  <p className="text-sm text-muted-foreground">Processing completes in reasonable time</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🔄</span>
                <div>
                  <p className="font-medium">Style Understanding</p>
                  <p className="text-sm text-muted-foreground">Different styles produce different suggestions</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>💡 Next Steps:</strong> If this validation looks good, we'll merge back to main and continue 
                with the full production implementation (AWS S3, proper UI, etc.).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}