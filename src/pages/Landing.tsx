import React from 'react';
import { 
  Target, 
  ArrowRight,
  Briefcase,
  CheckSquare,
  FileText,
  Calendar,
  Smartphone,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { responsiveClasses, cn } from '@/lib/responsive-utils';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [showInstall, setShowInstall] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  // Safeguard: Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (currentUser && !loading) {
      console.log('⚠️ Authenticated user accessing Landing page, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  const features = [
    {
      icon: 'CheckSquare',
      title: "Smart Task Management",
      description: "Organize tasks by priority, category, and due dates with intelligent reminders.",
      color: "text-primary"
    },
    {
      icon: 'FileText',
      title: "Digital Note-Taking",
      description: "Capture ideas, meeting notes, and thoughts with rich formatting and search.",
      color: "text-secondary"
    },
    {
      icon: 'Calendar',
      title: "Schedule Management",
      description: "Visual calendar with appointments, meetings, and event tracking.",
      color: "text-accent"
    },
    {
      icon: 'Smartphone',
      title: "PWA Ready",
      description: "Install as a native app, works offline, and syncs across all devices.",
      color: "text-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 pointer-events-none" />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-soft">
        <div className={cn(responsiveClasses.container.base, responsiveClasses.container.sm, responsiveClasses.container.md, responsiveClasses.container.lg)}>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Zentry</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Productivity Platform</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {/* Install Button */}
              {showInstall && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleInstall}
                  className="font-medium transition-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              {/* Mobile Install Button */}
              {showInstall && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleInstall}
                  className="font-medium transition-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={cn(responsiveClasses.padding.section, "relative")}>
        <div className={cn(responsiveClasses.container.base, responsiveClasses.container.sm, responsiveClasses.container.md, responsiveClasses.container.lg)}>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className={cn(responsiveClasses.text.heading, "font-bold mb-4 sm:mb-6 text-foreground drop-shadow-sm")}>
              Welcome to Zentry
            </h2>
            
            <p className={cn(responsiveClasses.text.subheading, "text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto")}>
              Your all-in-one productivity platform for managing tasks, capturing notes, and organizing your schedule with intelligence and ease.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
              <Button 
                size="lg"
                onClick={() => navigate('/signup')}
                className={cn(responsiveClasses.button.responsive, "bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-medium hover:shadow-large transition-all")}
              >
                Sign Up
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/login')}
                className={cn(responsiveClasses.button.responsive, "border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-semibold shadow-soft")}
              >
                Log In
              </Button>
              
              {showInstall && (
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={handleInstall}
                  className={cn(responsiveClasses.button.responsive, "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary hover:text-white transition-all font-semibold")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </Button>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 sm:mt-12">
              {/* Removed PWA Ready, Offline Support, Cross-Platform, Real-time Sync badges */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={cn(responsiveClasses.padding.section, "bg-muted/30 backdrop-blur-sm relative")}>
        <div className={cn(responsiveClasses.container.base, responsiveClasses.container.sm, responsiveClasses.container.md, responsiveClasses.container.lg)}>
          <div className="text-center mb-12 sm:mb-16">
            <h3 className={cn(responsiveClasses.text.heading, "font-bold text-foreground mb-4 drop-shadow-sm")}>
              Features
            </h3>
            <p className={cn(responsiveClasses.text.body, "text-muted-foreground max-w-2xl mx-auto leading-relaxed")}>
              Everything you need to stay organized and productive in one beautiful platform.
            </p>
          </div>
          <div className={cn(responsiveClasses.grid.fourColumn, "max-w-7xl mx-auto")}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon === 'CheckSquare' ? CheckSquare :
                                 feature.icon === 'FileText' ? FileText :
                                 feature.icon === 'Calendar' ? Calendar : Smartphone;
              
              return (
                <Card key={index} className="shadow-medium hover:shadow-large transition-all duration-300 group bg-card backdrop-blur-sm border border-border hover:border-primary/50">
                  <CardHeader className={cn(responsiveClasses.padding.small, "text-center pb-4")}>
                    <div className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${feature.color} group-hover:scale-110 transition-transform drop-shadow-sm`} />
                    </div>
                    <CardTitle className="text-base sm:text-lg text-card-foreground group-hover:text-primary transition-colors font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className={responsiveClasses.padding.small}>
                    <p className={cn(responsiveClasses.text.small, "text-muted-foreground text-center leading-relaxed")}>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Zentry</p>
                <p className="text-xs text-muted-foreground">Productivity Platform</p>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>© 2025 Zentry. All rights reserved.</span>
              <button 
                onClick={() => navigate('/diagnostics')}
                className="text-muted-foreground/60 hover:text-primary transition-colors text-xs underline"
              >
                Firebase Diagnostics
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;