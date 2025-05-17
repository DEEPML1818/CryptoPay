import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <Layout>
      <div className="w-full flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 pb-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">404 Page Not Found</h1>
            </div>

            <p className="mt-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
              The page "{location}" could not be found. It may have been moved or deleted, 
              or there might be a typo in the URL.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex items-center">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex items-center">
                <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
