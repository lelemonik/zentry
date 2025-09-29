import React from 'react';
import { ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen gradient-bg relative overflow-hidden">

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Central Glass Card */}
        <div className="glass-card max-w-lg w-full p-12 text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-foreground mb-2 tracking-tight">
              Zentry
            </h1>
            <p className="text-muted-foreground text-lg">
              Your Productivity Companion
            </p>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Streamline your workflow with our all-in-one productivity platform. 
            Manage tasks, capture notes, and organize your schedule effortlessly.
          </p>

          {/* CTA Button */}
          <Button 
            onClick={() => navigate('/signup')}
            size="lg"
            className="glass-button w-full py-4 text-lg font-semibold group hover:scale-105 transition-all duration-300"
          >
            Sign Up
          </Button>

          {/* Sign In Link */}
          <p className="mt-6 text-muted-foreground text-sm">
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-foreground hover:text-primary underline transition-colors font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-slate-400">
          <p>&copy; 2025 Zentry. All rights reserved.</p>
          <div className="flex gap-6 mt-2 sm:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;