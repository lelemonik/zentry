import React from 'react';
import { ArrowRight, CheckCircle2, Users, Calendar, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (currentUser && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8 leading-tight px-4">
            Zentry
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 mb-8 sm:mb-10 md:mb-12">
            The ultimate productivity platform that transforms how you work, organize, and achieve your goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button 
              onClick={() => navigate('/signup')}
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 rounded-lg sm:rounded-xl shadow-medium hover:shadow-large hover:scale-105 transition-all duration-300 group"
            >
              Sign Up
            </Button>

            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-border hover:bg-secondary/50 transition-all duration-300"
            >
              Login
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="glass rounded-xl sm:rounded-2xl shadow-large max-w-4xl w-full p-4 sm:p-6 md:p-8 relative overflow-hidden mx-4">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-subtle"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-muted/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-6 sm:mb-8 md:mb-10">
              Everything you need to stay productive
            </h2>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-secondary border border-border hover:scale-105 transition-all duration-300 group text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-6 transition-transform">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Smart Tasks</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Organize and prioritize with intelligent task management that adapts to your workflow</p>
              </div>
              
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-secondary border border-border hover:scale-105 transition-all duration-300 group text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-accent rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-6 transition-transform">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Rich Notes</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Capture ideas with powerful note-taking features and seamless organization</p>
              </div>
              
              <div className="flex flex-col items-center p-4 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-secondary border border-border hover:scale-105 transition-all duration-300 group text-center sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:rotate-6 transition-transform">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">Smart Schedule</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Plan your time with seamless calendar integration and intelligent scheduling</p>
              </div>
            </div>

            {/* Value Props */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-10 md:mt-12">
              <div className="flex items-center px-3 py-2 bg-card rounded-full border border-border">
                <Star className="w-4 h-4 text-foreground mr-2" />
                <span className="text-xs sm:text-sm font-medium text-card-foreground">Free to start</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-card rounded-full border border-border">
                <Shield className="w-4 h-4 text-foreground mr-2" />
                <span className="text-xs sm:text-sm font-medium text-card-foreground">Secure & private</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-card rounded-full border border-border">
                <Zap className="w-4 h-4 text-foreground mr-2" />
                <span className="text-xs sm:text-sm font-medium text-card-foreground">Lightning fast</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 py-4 sm:py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-muted-foreground gap-2 sm:gap-0">
          <p className="text-center sm:text-left">&copy; 2025 Zentry. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            <button 
              onClick={() => navigate('/privacy')}
              className="hover:text-foreground transition-colors text-xs sm:text-sm"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate('/terms')}
              className="hover:text-foreground transition-colors text-xs sm:text-sm"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;