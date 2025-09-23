import React, { useState } from 'react';
import { Home, StickyNote, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

import TaskManager from '@/components/TaskManager';
import NotesManager from '@/components/NotesManager';
import ClassSchedule from '@/components/ClassSchedule';
import UserSettings from '@/components/UserSettings';

const TABS = [
  { id: 'tasks', label: 'Home', icon: Home, component: TaskManager },
  { id: 'notes', label: 'Course', icon: StickyNote, component: NotesManager },
  { id: 'schedule', label: 'Schedule', icon: Calendar, component: ClassSchedule },
  { id: 'settings', label: 'Settings', icon: Settings, component: UserSettings },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState('tasks');

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || TaskManager;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Main Content */}
      <main className="flex-1 p-4 pb-20">
        <ActiveComponent />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-white border-t border-border">
        <div className="flex">
          {TABS.map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-3 transition-all",
                  isActive 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconComponent className={cn(
                  "h-5 w-5 mb-1 transition-all",
                  isActive && "scale-110"
                )} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}