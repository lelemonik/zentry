import React, { useState } from 'react';
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
import TaskManager from '@/components/TaskManager';
import NotesManager from '@/components/NotesManager';
import ClassSchedule from '@/components/ClassSchedule';
import UserSettings from '@/components/UserSettings';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { responsiveClasses, cn } from '@/lib/responsive-utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className={cn(responsiveClasses.container.base, responsiveClasses.container.sm, responsiveClasses.container.md, responsiveClasses.container.lg)}>
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Zentry</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your productivity companion</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Card className="glass hidden sm:block">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </CardContent>
              </Card>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || 'User'} />
                      <AvatarFallback>
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
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(responsiveClasses.container.base, responsiveClasses.container.sm, responsiveClasses.container.md, responsiveClasses.container.lg, "py-4 sm:py-6")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8">
            <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-3 h-auto">
              <TabsTrigger value="tasks" className="flex flex-col gap-1 py-2 sm:py-3 px-2 sm:px-4">
                <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex flex-col gap-1 py-2 sm:py-3 px-2 sm:px-4">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex flex-col gap-1 py-2 sm:py-3 px-2 sm:px-4">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Schedule</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="animate-fade-in">
            <TaskManager />
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
            <NotesManager />
          </TabsContent>

          <TabsContent value="schedule" className="animate-fade-in">
            <ClassSchedule />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-background/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built for professionals, by professionals. Stay organized, stay productive.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>📱 PWA Ready</span>
              <span>🔄 Auto-save</span>
              <span>🎨 Customizable</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          <UserProfile />
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
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
