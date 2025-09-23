import React, { useState } from 'react';
import { CheckSquare, FileText, Calendar, Settings, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskManager from '@/components/TaskManager';
import NotesManager from '@/components/NotesManager';
import ClassSchedule from '@/components/ClassSchedule';
import UserSettings from '@/components/UserSettings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StudySync</h1>
                <p className="text-sm text-muted-foreground">Your productivity companion</p>
              </div>
            </div>
            
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="tasks" className="flex flex-col gap-1 py-3">
                <CheckSquare className="h-4 w-4" />
                <span className="text-xs">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex flex-col gap-1 py-3">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex flex-col gap-1 py-3">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col gap-1 py-3">
                <Settings className="h-4 w-4" />
                <span className="text-xs">Settings</span>
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

          <TabsContent value="settings" className="animate-fade-in">
            <UserSettings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-background/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Built for students, by students. Stay organized, stay productive.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>📱 PWA Ready</span>
              <span>🔄 Auto-save</span>
              <span>🎨 Customizable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
