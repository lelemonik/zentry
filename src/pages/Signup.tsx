import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading';


const SignupPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, currentUser, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Navigate to dashboard if user is already authenticated
  useEffect(() => {
    if (currentUser && !authLoading) {
      console.log('✅ User is authenticated, navigating to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  // Check for redirect authentication errors on mount
  useEffect(() => {
    const redirectError = localStorage.getItem('authRedirectError');
    if (redirectError) {
      setError(redirectError);
      localStorage.removeItem('authRedirectError');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: "At least 8 characters" },
      { test: /[a-z]/.test(password), text: "One lowercase letter" },
      { test: /\d/.test(password), text: "One number" },
    ];
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    // Username validation
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      // For username-based signup, we'll use username@zentry.local as email format
      const email = `${formData.username}@zentry.local`;
      await register(email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('🔄 Starting Google signup...');
      
      // Check for any previous redirect errors
      const redirectError = localStorage.getItem('authRedirectError');
      if (redirectError) {
        localStorage.removeItem('authRedirectError');
        throw new Error(redirectError);
      }

      // Try popup first (better UX), fallback to redirect if needed
      await loginWithGoogle(true);
      
      // If we get here with popup, navigation should happen via auth state change
      console.log('✅ Google signup initiated successfully');
      
    } catch (error: any) {
      console.error('❌ Google signup error:', error);
      
      let errorMessage = 'Failed to sign up with Google. Please try again.';
      
      // Provide specific error messages for better UX
      if (error.message?.includes('popup')) {
        errorMessage = 'Popup was blocked. Please allow popups or try again.';
      } else if (error.message?.includes('cancelled')) {
        errorMessage = 'Sign up was cancelled. Please try again when ready.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('configuration')) {
        errorMessage = 'Authentication is not properly configured. Please contact support.';
      } else if (error.message?.includes('unauthorized')) {
        errorMessage = 'This app is not authorized for Google Sign-In. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4 safe-top safe-bottom">
      <div className="w-full max-w-xs sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Join Zentry</h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Start your productivity journey today</p>
        </div>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover-lift">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-center font-semibold text-gray-900">Create Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Network Status Indicator */}


            {/* Google Signup Button */}
            <Button
              type="button"
              variant="outline"
              className={`w-full transition-all duration-200 ${
                (loading || authLoading) 
                  ? 'bg-muted cursor-not-allowed' 
                  : 'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]'
              }`}
              onClick={handleGoogleSignup}
              disabled={loading || authLoading}
            >
              {(loading || authLoading) ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  Signing up...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc04"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ea4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>



            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={loading}
                    minLength={3}
                    pattern="[a-zA-Z0-9_-]+"
                    title="Username must be at least 3 characters and can only contain letters, numbers, underscores, and hyphens"
                  />
                </div>
                {formData.username && (
                  <div className="space-y-1">
                    {formData.username.length < 3 && (
                      <p className="text-xs text-destructive">Username must be at least 3 characters long</p>
                    )}
                    {formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username) && (
                      <p className="text-xs text-destructive">Username can only contain letters, numbers, underscores, and hyphens</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Check className={`h-3 w-3 ${req.test ? 'text-success' : 'text-muted-foreground'}`} />
                        <span className={req.test ? 'text-success' : 'text-muted-foreground'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="terms" className="text-sm text-foreground font-medium">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading || !acceptTerms}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground font-medium">Already have an account? </span>
              <Link 
                to="/login" 
                className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;