import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Transform Empty Rooms with{" "}
            <span className="text-blue-600">AI Virtual Staging</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Professional virtual staging for real estate professionals. Upload empty room photos 
            and get stunning, market-ready staged images powered by advanced AI technology.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start Staging Rooms
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Why Choose Magic Staging?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional-grade virtual staging at $4.99 per room
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">AI Powered</Badge>
                  Advanced Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Powered by Google&apos;s Gemini 2.5 Flash Image model for 
                  photorealistic virtual staging results that sell properties faster.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">$4.99</Badge>
                  Per Room Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Transparent, affordable pricing with bulk discounts. 
                  No monthly fees - pay only for what you stage.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Fast</Badge>
                  Quick Turnaround
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get professionally staged images in minutes, not days. 
                  Perfect for busy real estate professionals.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <div className="bg-blue-600 rounded-2xl px-6 py-16 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Listings?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of real estate professionals using AI virtual staging
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Get Started Free
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
