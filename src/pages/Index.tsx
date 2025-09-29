import React, { useState, useEffect } from 'react';
import { CheckSquare, FileText, Calendar, Settings, Briefcase, LogOut, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import UserSettings from '@/components/UserSettings';

import { dataPreloader } from '@/lib/data-preloader';
import { performanceOptimizer } from '@/lib/performance-optimizer';
import { InstantLoadWrapper } from '@/components/InstantLoadWrapper';
import { loadTasks, loadNotes, loadSchedules } from '@/lib/universal-sync';
import { lazy, Suspense } from 'react';

// Lazy load heavy components with instant loading optimization
const TaskManager = lazy(() => import('@/components/TaskManager'));
const NotesManager = lazy(() => import('@/components/NotesManager'));
const ClassSchedule = lazy(() => import('@/components/ClassSchedule'));
const UserProfile = lazy(() => import('@/components/UserProfile'));
import { useAuth } from '@/contexts/AuthContext';
import { responsiveClasses, cn } from '@/lib/responsive-utils';
import { useMobileDetection } from '@/hooks/use-mobile-detection';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { isMobile, touchDevice, pwaInstalled } = useMobileDetection();

  // Enhanced tab switching with haptic feedback
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Trigger haptic feedback on mobile devices
    if (touchDevice && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Announce tab change for accessibility
    if (isMobile) {
      const announcement = `Switched to ${value} tab`;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.volume = 0.1;
        utterance.rate = 1.5;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Real data counts for badges
  const [itemCounts, setItemCounts] = useState({
    tasks: 0,
    notes: 0,
    schedule: 0
  });

  // Load real data counts
  const loadDataCounts = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const [tasks, notes, schedules] = await Promise.all([
        loadTasks(currentUser.uid),
        loadNotes(currentUser.uid),
        loadSchedules(currentUser.uid)
      ]);

      setItemCounts({
        tasks: tasks.filter(task => !task.completed).length, // Only count active tasks
        notes: notes.length,
        schedule: schedules.length
      });
    } catch (error) {
      console.error('Error loading data counts:', error);
    }
  };

  // Preload data and optimize performance when component mounts
  useEffect(() => {
    if (currentUser?.uid) {
      // Start data preloading
      dataPreloader.preloadUserData(currentUser.uid);
      
      // Prefetch route data for instant switching
      performanceOptimizer.prefetchRouteData(currentUser.uid);
      
      // Load real data counts
      loadDataCounts();
      
      console.log('🚀 Dashboard optimization started for user:', currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Listen for data updates to refresh counts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const handleDataUpdate = () => {
      loadDataCounts();
    };

    // Listen for universal sync events
    window.addEventListener('tasksUpdated', handleDataUpdate);
    window.addEventListener('notesUpdated', handleDataUpdate);
    window.addEventListener('schedulesUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('tasksUpdated', handleDataUpdate);
      window.removeEventListener('notesUpdated', handleDataUpdate);
      window.removeEventListener('schedulesUpdated', handleDataUpdate);
    };
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen gradient-bg hw-accelerated">
      {/* Mobile-style Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Zentry</h1>
            </div>
          </div>
            
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || 'User'} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {currentUser?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full hw-accelerated">
          <div className="flex justify-center mb-6 sm:mb-8">
            <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-3 floating-tabs rounded-xl sm:rounded-2xl p-1 sm:p-1.5">
              <TabsTrigger 
                value="tasks" 
                className="group relative flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-4 px-3 sm:px-6 rounded-lg sm:rounded-xl tab-glow-effect transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-800 data-[state=active]:scale-105 text-gray-600 hover:text-gray-700 hover:bg-white/50"
              >
                <div className="relative">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full scale-0 group-data-[state=active]:scale-100 transition-transform duration-300"></div>
                  {itemCounts.tasks > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] sm:text-xs w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-semibold animate-pulse shadow-sm">
                      {itemCounts.tasks > 9 ? '9+' : itemCounts.tasks}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium tracking-wide transition-all duration-300 group-data-[state=active]:font-semibold">Tasks</span>
                <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-primary rounded-full transition-all duration-300 group-data-[state=active]:w-6 sm:group-data-[state=active]:w-8 group-data-[state=active]:-translate-x-3 sm:group-data-[state=active]:-translate-x-4"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="notes" 
                className="group relative flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-4 px-3 sm:px-6 rounded-lg sm:rounded-xl tab-glow-effect transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-800 data-[state=active]:scale-105 text-gray-600 hover:text-gray-700 hover:bg-white/50"
              >
                <div className="relative">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <div className="absolute -inset-1 bg-success/20 rounded-full scale-0 group-data-[state=active]:scale-100 transition-transform duration-300"></div>
                  {itemCounts.notes > 0 && (
                    <span className="absolute -top-1 -right-1 bg-success text-success-foreground text-[10px] sm:text-xs w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-semibold animate-pulse shadow-sm">
                      {itemCounts.notes > 9 ? '9+' : itemCounts.notes}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium tracking-wide transition-all duration-300 group-data-[state=active]:font-semibold">Notes</span>
                <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-success rounded-full transition-all duration-300 group-data-[state=active]:w-6 sm:group-data-[state=active]:w-8 group-data-[state=active]:-translate-x-3 sm:group-data-[state=active]:-translate-x-4"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="schedule" 
                className="group relative flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-4 px-3 sm:px-6 rounded-lg sm:rounded-xl tab-glow-effect transition-all duration-300 ease-out hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-800 data-[state=active]:scale-105 text-gray-600 hover:text-gray-700 hover:bg-white/50"
              >
                <div className="relative">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <div className="absolute -inset-1 bg-accent/30 rounded-full scale-0 group-data-[state=active]:scale-100 transition-transform duration-300"></div>
                  {itemCounts.schedule > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] sm:text-xs w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-semibold animate-pulse shadow-sm">
                      {itemCounts.schedule > 9 ? '9+' : itemCounts.schedule}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium tracking-wide transition-all duration-300 group-data-[state=active]:font-semibold">Schedule</span>
                <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-accent rounded-full transition-all duration-300 group-data-[state=active]:w-6 sm:group-data-[state=active]:w-8 group-data-[state=active]:-translate-x-3 sm:group-data-[state=active]:-translate-x-4"></div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="animate-fade-in preload-critical data-[state=active]:animate-slide-up">
            <div className="glass-surface rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hw-accelerated backdrop-blur-sm transition-all duration-500 hover:shadow-medium">
              <InstantLoadWrapper componentName="TaskManager" fallback={<LoadingSkeleton type="tasks" />}>
                <Suspense fallback={<LoadingSkeleton type="tasks" />}>
                  <TaskManager />
                </Suspense>
              </InstantLoadWrapper>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in preload-critical data-[state=active]:animate-slide-up">
            <div className="glass-surface rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hw-accelerated backdrop-blur-sm transition-all duration-500 hover:shadow-medium">
              <InstantLoadWrapper componentName="NotesManager" fallback={<LoadingSkeleton type="notes" />}>
                <Suspense fallback={<LoadingSkeleton type="notes" />}>
                  <NotesManager />
                </Suspense>
              </InstantLoadWrapper>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="animate-fade-in preload-critical data-[state=active]:animate-slide-up">
            <div className="glass-surface rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hw-accelerated backdrop-blur-sm transition-all duration-500 hover:shadow-medium">
              <InstantLoadWrapper componentName="ClassSchedule" fallback={<LoadingSkeleton type="schedule" />}>
                <Suspense fallback={<LoadingSkeleton type="schedule" />}>
                  <ClassSchedule />
                </Suspense>
              </InstantLoadWrapper>
            </div>
          </TabsContent>
        </Tabs>
      </main>



      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-white rounded-xl border border-gray-200 w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          <InstantLoadWrapper componentName="UserProfile" fallback={<LoadingSkeleton type="profile" />}>
            <Suspense fallback={<LoadingSkeleton type="profile" />}>
              <UserProfile />
            </Suspense>
          </InstantLoadWrapper>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-white rounded-xl border border-gray-200 w-[95vw] max-w-4xl h-[85vh] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <UserSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
