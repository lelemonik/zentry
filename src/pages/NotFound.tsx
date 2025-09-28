import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RefreshCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-3 sm:p-4">
      <Card className="shadow-large bg-card text-card-foreground border-border max-w-md w-full">
        <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-4xl sm:text-6xl font-bold text-foreground mb-2">404</CardTitle>
          <p className="text-lg sm:text-xl text-muted-foreground font-medium">Page Not Found</p>
        </CardHeader>
        <CardContent className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Sorry, we couldn't find the page you're looking for. The URL may be incorrect or the page may have been moved.
          </p>
          <div className="flex flex-col gap-2 sm:gap-3 pt-2">
            <Button asChild variant="default" className="w-full text-sm sm:text-base py-2 sm:py-3">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full text-sm sm:text-base py-2 sm:py-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
