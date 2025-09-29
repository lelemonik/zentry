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
    <div className="min-h-screen gradient-bg">
      {/* Mobile-style Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Zentry</h1>
            </div>
          </div>
            
          <div className="flex items-center gap-4">
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
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
              <TabsTrigger 
                value="tasks" 
                className="flex flex-col gap-1 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-700 text-gray-500 hover:text-gray-600"
              >
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm">Tasks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="flex flex-col gap-1 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-700 text-gray-500 hover:text-gray-600"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Notes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schedule" 
                className="flex flex-col gap-1 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-700 text-gray-500 hover:text-gray-600"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Schedule</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks" className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <TaskManager />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <NotesManager />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <ClassSchedule />
            </div>
          </TabsContent>
        </Tabs>
      </main>



      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-white rounded-xl border border-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          <UserProfile />
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-white rounded-xl border border-gray-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
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
