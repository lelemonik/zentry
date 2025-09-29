import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, MapPin, BookOpen, Edit2, Trash2, Calendar, Bell, BellOff, Cloud, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { autoSaveSchedules, loadSchedules, EventItem as SyncEventItem } from '@/lib/universal-sync';
import { offlineDB, initOfflineDB } from '../lib/offline-db';
import { notificationScheduler } from '@/lib/notification-scheduler';
import { responsiveClasses } from '@/lib/responsive-utils';
import { useToast } from '@/hooks/use-toast';

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  color: string;
  hasReminder: boolean;
  reminderMinutes: number;
  reminderId?: string;
  isRecurring: boolean;
  eventType: 'class' | 'meeting' | 'appointment' | 'personal' | 'work' | 'other';
  createdAt?: Date;
  lastModified?: number;
}

const COLORS = [
  'bg-primary', 'bg-secondary', 'bg-accent', 'bg-success', 
  'bg-warning', 'bg-destructive'
];

// Helper functions for date operations
const getWeekDates = (startDate: Date) => {
  const week = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    week.push(date.toISOString().split('T')[0]); // YYYY-MM-DD format
  }
  return week;
};

const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export default function Schedule() {
  const { currentUser: user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    startTime: '',
    endTime: '',
    color: 'bg-primary',
    eventType: 'personal' as const,
    hasReminder: false,
    reminderMinutes: 15,
    isRecurring: false // Changed default to false since we're using specific dates
  });

  // Load schedules when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserSchedules();
      initializeOffline();
    } else {
      setEvents([]);
      setIsLoading(false);
    }
  }, [user]);

  // Listen for real-time updates from other devices
  useEffect(() => {
    if (!user) return;

    const handleSchedulesUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.uid) {
        console.log('📱 Received schedules update from another device');
        const updatedSchedules = event.detail.data?.schedules || [];
        setEvents(updatedSchedules);
      }
    };

    window.addEventListener('schedulesUpdated', handleSchedulesUpdate as EventListener);
    return () => {
      window.removeEventListener('schedulesUpdated', handleSchedulesUpdate as EventListener);
    };
  }, [user]);

  // Initialize offline storage and notification system
  const initializeOffline = async () => {
    try {
      await initOfflineDB();
      await notificationScheduler.initialize();
      setOfflineReady(true);
    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
    }
  };

  const loadUserSchedules = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userSchedules = await loadSchedules(user.uid);
      setEvents(userSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchedulesToCloud = async (updatedSchedules: EventItem[]) => {
    if (!user) return;

    try {
      setIsAutoSaving(true);
      await autoSaveSchedules(user.uid, updatedSchedules, 2000);
    } catch (error) {
      console.error('Failed to auto-save schedules:', error);
    } finally {
      // Reset auto-saving indicator after a delay
      setTimeout(() => setIsAutoSaving(false), 3000);
    }
  };

  // Sync schedules to IndexedDB when schedules change
  useEffect(() => {
    if (offlineReady && events.length > 0) {
      events.forEach(async (schedule) => {
        try {
          const existingSchedule = await offlineDB.get('schedules', schedule.id);
          if (existingSchedule) {
            await offlineDB.updateSchedule(schedule);
          } else {
            await offlineDB.addSchedule(schedule);
          }
        } catch (error) {
          console.error('Error syncing schedule to offline storage:', error);
        }
      });
    }
  }, [events, offlineReady]);

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) return;
    
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const eventItem: EventItem = {
      id: scheduleId,
      ...newEvent,
      createdAt: new Date(),
      lastModified: Date.now(),
    };

    try {
      // Schedule reminder if enabled
      if (newEvent.hasReminder) {
        // For date-based schedules, schedule for the specific date and time
        const eventDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
        const reminderTime = new Date(eventDateTime.getTime() - (newEvent.reminderMinutes * 60 * 1000));
        
        const reminderId = await notificationScheduler.scheduleScheduleReminder(
          { ...eventItem, subject: newEvent.title, date: newEvent.date, time: newEvent.startTime },
          reminderTime
        );
        eventItem.reminderId = reminderId;
      }

      // Add to local state
      const updatedSchedules = [...events, eventItem];
      setEvents(updatedSchedules);

      // Save to offline storage
      if (offlineReady) {
        await offlineDB.addSchedule(eventItem);
      }

      // Auto-save to cloud
      saveSchedulesToCloud(updatedSchedules);

      // Reset form
      setNewEvent({
        title: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        color: 'bg-primary',
        eventType: 'personal',
        hasReminder: false,
        reminderMinutes: 15,
        isRecurring: false
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<EventItem>) => {
    const updatedEvent = { 
      ...events.find(evt => evt.id === id)!, 
      ...updates,
      lastModified: Date.now()
    };
    
    const updatedSchedules = events.map(evt => 
      evt.id === id ? updatedEvent : evt
    );
    setEvents(updatedSchedules);

    if (offlineReady) {
      await offlineDB.updateSchedule(updatedClass);
    }
    
    // Auto-save to cloud
    saveSchedulesToCloud(updatedSchedules);
  };

  const deleteEvent = async (id: string) => {
    const eventItem = events.find(evt => evt.id === id);
    
    try {
      // Cancel any active reminders
      if (eventItem?.reminderId) {
        await notificationScheduler.cancelReminder(eventItem.reminderId);
      }

      const updatedSchedules = events.filter(evt => evt.id !== id);
      setEvents(updatedSchedules);
      setEditingClass(null);

      // Remove from offline storage
      if (offlineReady) {
        await offlineDB.delete('schedules', id);
      }
      
      // Auto-save to cloud
      saveSchedulesToCloud(updatedSchedules);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Still update UI even if reminder cancellation failed
      const updatedSchedules = events.filter(evt => evt.id !== id);
      setEvents(updatedSchedules);
      setEditingClass(null);
      saveSchedulesToCloud(updatedSchedules);
    }
  };

  const toggleClassReminder = async (id: string) => {
    const classItem = classes.find(cls => cls.id === id);
    if (!classItem) return;

    try {
      const updatedClass = { 
        ...classItem, 
        hasReminder: !classItem.hasReminder,
        lastModified: Date.now()
      };

      if (!classItem.hasReminder && classItem.isRecurring) {
        // Enable recurring reminder
        const dayIndex = DAYS.indexOf(classItem.day);
        const reminderId = await notificationScheduler.scheduleRecurringScheduleReminder(
          { ...updatedClass, subject: classItem.name, date: '', time: classItem.startTime },
          classItem.reminderMinutes,
          [dayIndex]
        );
        updatedClass.reminderId = reminderId;
      } else if (classItem.hasReminder && classItem.reminderId) {
        // Disable reminder
        await notificationScheduler.cancelReminder(classItem.reminderId);
        updatedClass.reminderId = undefined;
      }

      const updatedSchedules = classes.map(cls => cls.id === id ? updatedClass : cls);
      setClasses(updatedSchedules);

      if (offlineReady) {
        await offlineDB.updateSchedule(updatedClass);
      }
      
      // Auto-save to cloud
      saveSchedulesToCloud(updatedSchedules);
    } catch (error) {
      console.error('Error toggling schedule reminder:', error);
    }
  };

  const getEventsForDate = (date: string) => {
    return events
      .filter(evt => evt.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  const generateWallpaper = async () => {
    if (!scheduleRef.current) return;
    
    setIsGeneratingWallpaper(true);
    
    toast({
      title: "Generating Wallpaper...",
      description: "Creating your personalized schedule wallpaper sized for your screen.",
    });
    
    try {
      // Get screen dimensions
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      // Create a canvas with screen dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = screenWidth;
      canvas.height = screenHeight;
      
      // Add roundRect polyfill if needed
      if (!ctx.roundRect) {
        (ctx as any).roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
          this.beginPath();
          this.moveTo(x + radius, y);
          this.lineTo(x + width - radius, y);
          this.quadraticCurveTo(x + width, y, x + width, y + radius);
          this.lineTo(x + width, y + height - radius);
          this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          this.lineTo(x + radius, y + height);
          this.quadraticCurveTo(x, y + height, x, y + height - radius);
          this.lineTo(x, y + radius);
          this.quadraticCurveTo(x, y, x + radius, y);
          this.closePath();
        };
      }
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, screenWidth, screenHeight);
      gradient.addColorStop(0, '#f1f5f9');
      gradient.addColorStop(0.3, '#f8fafc');
      gradient.addColorStop(0.7, '#f1f5f9');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      
      // Add decorative elements
      ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * screenWidth;
        const y = Math.random() * screenHeight;
        const radius = Math.random() * 30 + 10;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('My Schedule', screenWidth / 2, 80);
      
      // Add current date
      ctx.fillStyle = '#64748b';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      ctx.fillText(currentDate, screenWidth / 2, 120);
      
      // Add subtle pattern
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 0; i < screenWidth; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, screenHeight);
        ctx.stroke();
      }
      for (let i = 0; i < screenHeight; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(screenWidth, i);
        ctx.stroke();
      }
      
      // Calculate schedule area
      const scheduleStartY = 170;
      const scheduleWidth = Math.min(screenWidth - 200, 1200);
      const scheduleHeight = screenHeight - 250;
      const scheduleStartX = (screenWidth - scheduleWidth) / 2;
      
      // Draw schedule background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      (ctx as any).roundRect(scheduleStartX, scheduleStartY, scheduleWidth, scheduleHeight, 16);
      ctx.fill();
      
      // Draw schedule header
      const weekDates = getWeekDates(currentWeekStart);
      const headers = ['Time', ...weekDates.map(date => formatDateDisplay(date))];
      const colWidth = scheduleWidth / 8;
      
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      
      headers.forEach((header, index) => {
        const x = scheduleStartX + (index * colWidth) + (colWidth / 2);
        ctx.fillText(header, x, scheduleStartY + 40);
      });
      
      // Draw time slots and classes
      const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM
      const rowHeight = (scheduleHeight - 60) / 13;
      
      timeSlots.forEach((hour, rowIndex) => {
        const y = scheduleStartY + 60 + (rowIndex * rowHeight);
        
        // Draw time
        ctx.fillStyle = '#64748b';
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const timeStr = `${hour}:00`;
        ctx.fillText(timeStr, scheduleStartX + (colWidth / 2), y + (rowHeight / 2) + 6);
        
        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(scheduleStartX, y);
        ctx.lineTo(scheduleStartX + scheduleWidth, y);
        ctx.stroke();
        
        // Draw vertical lines
        for (let col = 0; col <= 8; col++) {
          ctx.beginPath();
          ctx.moveTo(scheduleStartX + (col * colWidth), scheduleStartY + 60);
          ctx.lineTo(scheduleStartX + (col * colWidth), scheduleStartY + scheduleHeight);
          ctx.stroke();
        }
        
        // Draw events for this time slot
        const weekDates = getWeekDates(currentWeekStart);
        weekDates.forEach((date, dayIndex) => {
          const dayEvents = getEventsForDate(date).filter(evt => {
            const eventHour = parseInt(evt.startTime.split(':')[0]);
            return eventHour === hour;
          });
          
          dayEvents.forEach((evt, eventIndex) => {
            const x = scheduleStartX + ((dayIndex + 1) * colWidth) + 8;
            const eventY = y + 8 + (eventIndex * 25);
            const eventWidth = colWidth - 16;
            const eventHeight = Math.min(24, rowHeight - 16);
            
            // Get color based on event color
            const colors: { [key: string]: string } = {
              'bg-primary': '#64748b',
              'bg-secondary': '#94a3b8',
              'bg-accent': '#475569',
              'bg-success': '#16a34a',
              'bg-warning': '#ca8a04',
              'bg-destructive': '#dc2626'
            };
            
            ctx.fillStyle = colors[evt.color] || '#64748b';
            (ctx as any).roundRect(x, eventY, eventWidth, eventHeight, 4);
            ctx.fill();
            
            // Draw event text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'left';
            const textY = eventY + 16;
            
            // Truncate text to fit
            let text = evt.title;
            const maxWidth = eventWidth - 8;
            while (ctx.measureText(text).width > maxWidth && text.length > 0) {
              text = text.slice(0, -1);
            }
            if (text.length < evt.title.length) text += '...';
            
            ctx.fillText(text, x + 4, textY);
          });
        });
      });
      
      // Add watermark
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generated by Zentry', screenWidth / 2, screenHeight - 30);
      
      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `schedule-wallpaper-${screenWidth}x${screenHeight}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Wallpaper Generated! 🎉",
            description: `Schedule wallpaper (${screenWidth}×${screenHeight}) has been downloaded to your device.`,
          });
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error generating wallpaper:', error);
      toast({
        title: "Error Generating Wallpaper",
        description: "Failed to create wallpaper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWallpaper(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = hour.toString().padStart(2, '0') + ':00';
      slots.push(time);
      if (hour < 22) {
        slots.push(hour.toString().padStart(2, '0') + ':30');
      }
    }
    return slots;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Card className="glass-card shadow-medium">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              My Schedule
            </div>
            <div className="flex items-center gap-2">
              {events.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateWallpaper}
                  disabled={isGeneratingWallpaper}
                  className="flex items-center gap-2 bg-gradient-accent hover:opacity-90 border-accent text-white"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isGeneratingWallpaper ? 'Generating...' : 'Wallpaper'}
                  </span>
                </Button>
              )}
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="h-4 w-4 animate-pulse" />
                  <span className="hidden sm:inline">Auto-saving...</span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-accent hover:opacity-90 transition-opacity text-sm sm:text-base py-2 sm:py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>

          {isCreating && (
            <Card className="mt-3 sm:mt-4 glass-surface border-2 border-accent animate-slide-up">
              <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    placeholder="Event Title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Location (optional)"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Select value={newEvent.eventType} onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, eventType: value }))}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "text-sm sm:text-base justify-start text-left font-normal",
                          !newEvent.date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newEvent.date ? formatDateDisplay(newEvent.date) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newEvent.date ? new Date(newEvent.date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setNewEvent(prev => ({ 
                              ...prev, 
                              date: date.toISOString().split('T')[0] 
                            }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={newEvent.startTime} onValueChange={(value) => setNewEvent(prev => ({ ...prev, startTime: value }))}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newEvent.endTime} onValueChange={(value) => setNewEvent(prev => ({ ...prev, endTime: value }))}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="End time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reminder Settings */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Reminder Settings</Label>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="reminder-toggle"
                        checked={newEvent.hasReminder}
                        onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, hasReminder: checked }))}
                      />
                      <Label htmlFor="reminder-toggle" className="text-sm flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Enable Reminders
                      </Label>
                    </div>
                    
                    {newEvent.hasReminder && (
                      <>
                        <Select 
                          value={newEvent.reminderMinutes.toString()} 
                          onValueChange={(value) => setNewEvent(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 min</SelectItem>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">before event</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        color,
                        newEvent.color === color && "ring-2 ring-offset-2 ring-ring"
                      )}
                      onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewEvent({
                        title: '', description: '', location: '', date: new Date().toISOString().split('T')[0],
                        startTime: '', endTime: '', color: 'bg-primary', eventType: 'personal',
                        hasReminder: false, reminderMinutes: 15, isRecurring: false
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createEvent} className="bg-accent">
                    Add Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="glass-card shadow-medium">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-40 mb-4"></div>
              <div className="grid grid-cols-8 gap-2 min-h-96">
                <div className="space-y-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card shadow-medium overflow-hidden">
          <CardContent className="p-0">
            {/* Week Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <div className="font-semibold text-sm sm:text-base">
                  {getWeekDates(currentWeekStart)[0]} - {getWeekDates(currentWeekStart)[6]}
                </div>
                <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs text-muted-foreground">
                  Today
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="overflow-x-auto" ref={scheduleRef}>
              <div className="min-w-[280px] sm:min-w-[600px] lg:min-w-[800px]">
                {/* Header with dates */}
                <div className="grid grid-cols-8 border-b border-border/20">
                  <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground bg-muted/30">
                    Time
                  </div>
                  {getWeekDates(currentWeekStart).map(date => (
                    <div key={date} className="p-2 sm:p-4 text-center border-l border-border/20">
                      <div className="font-medium text-xs sm:text-sm">{getDayName(date).slice(0, 3)}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(date).getDate()}</div>
                    </div>
                  ))}
                </div>

                {/* Time slots grid */}
                {Array.from({ length: 13 }, (_, index) => {
                  const hour = 7 + index; // Start from 7:30 AM
                  const timeSlot = `${hour}:30 - ${hour + 1}:00`;
                  const displayTime = `${hour.toString().padStart(2, '0')}:30`;
                  
                  return (
                    <div key={timeSlot} className="grid grid-cols-8 border-b border-border/10 min-h-[60px] sm:min-h-[80px]">
                      {/* Time label */}
                      <div className="p-2 sm:p-4 text-xs sm:text-sm text-muted-foreground bg-muted/10 border-r border-border/20 flex items-center">
                        <span className="text-xs">{displayTime}</span>
                      </div>
                      
                      {/* Date columns */}
                      {getWeekDates(currentWeekStart).map(date => {
                        const dateEvents = getEventsForDate(date).filter(evt => {
                          const eventHour = parseInt(evt.startTime.split(':')[0]);
                          return eventHour === hour;
                        });
                        
                        return (
                          <div key={`${date}-${timeSlot}`} className="border-l border-border/10 p-0.5 sm:p-1 relative min-h-[60px] sm:min-h-[80px]">
                            {dateEvents.map(evt => (
                              <div 
                                key={evt.id}
                                className={cn(
                                  "transition-all duration-200 hover:shadow-sm cursor-pointer border-0 rounded p-1 sm:p-2 text-xs text-white m-0.5 sm:m-1 touch-manipulation",
                                  evt.color
                                )}
                                onClick={() => setEditingClass(editingClass === evt.id ? null : evt.id)}
                              >
                                <div className="font-medium truncate text-xs sm:text-sm leading-tight">{evt.title}</div>
                                <div className="text-xs opacity-90 truncate hidden sm:block">{evt.description || evt.eventType}</div>
                                <div className="text-xs opacity-75 hidden sm:block">{formatTime(evt.startTime)} - {formatTime(evt.endTime)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal for selected event */}
      {editingClass && events.find(evt => evt.id === editingClass) && (
        <Card className="glass-modal shadow-large mx-2 sm:mx-0">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Edit Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {(() => {
              const evt = events.find(e => e.id === editingClass);
              if (!evt) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Class Name</Label>
                      <Input
                        id="name"
                        value={cls.name}
                        onChange={(e) => updateClass(cls.id, { name: e.target.value })}
                        placeholder="Class name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="organizer">Organizer</Label>
                      <Input
                        id="organizer"
                        value={cls.organizer}
                        onChange={(e) => updateClass(cls.id, { organizer: e.target.value })}
                        placeholder="Organizer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={cls.location}
                      onChange={(e) => updateClass(cls.id, { location: e.target.value })}
                      placeholder="Location"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !cls.date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {cls.date ? formatDateDisplay(cls.date) : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={cls.date ? new Date(cls.date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                updateClass(cls.id, { 
                                  date: date.toISOString().split('T')[0] 
                                });
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Select value={cls.startTime} onValueChange={(value) => updateClass(cls.id, { startTime: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeSlots().map(time => (
                            <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Select value={cls.endTime} onValueChange={(value) => updateClass(cls.id, { endTime: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeSlots().map(time => (
                            <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all",
                            color,
                            cls.color === color && "ring-2 ring-primary"
                          )}
                          onClick={() => updateClass(cls.id, { color })}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="reminder"
                      checked={cls.hasReminder}
                      onCheckedChange={(checked) => updateClass(cls.id, { hasReminder: checked })}
                    />
                    <Label htmlFor="reminder">Enable reminder</Label>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingClass(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => deleteClass(cls.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button onClick={() => setEditingClass(null)}>
                      Done
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}