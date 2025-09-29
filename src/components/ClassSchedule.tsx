import React, { useState, useEffect } from 'react';
import { Plus, Clock, MapPin, BookOpen, Edit2, Trash2, Calendar, Bell, BellOff, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { autoSaveSchedules, loadSchedules, ClassItem as SyncClassItem } from '@/lib/universal-sync';
import { offlineDB, initOfflineDB } from '../lib/offline-db';
import { notificationScheduler } from '@/lib/notification-scheduler';
import { responsiveClasses } from '@/lib/responsive-utils';

interface ClassItem {
  id: string;
  name: string;
  organizer: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
  hasReminder: boolean;
  reminderMinutes: number;
  reminderId?: string;
  isRecurring: boolean;
  createdAt?: Date;
  lastModified?: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = [
  'bg-primary', 'bg-secondary', 'bg-accent', 'bg-success', 
  'bg-warning', 'bg-destructive'
];

export default function ClassSchedule() {
  const { currentUser: user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newClass, setNewClass] = useState({
    name: '',
    organizer: '',
    location: '',
    day: '',
    startTime: '',
    endTime: '',
    color: 'bg-primary',
    hasReminder: false,
    reminderMinutes: 15,
    isRecurring: true
  });

  // Load schedules when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserSchedules();
      initializeOffline();
    } else {
      setClasses([]);
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
        setClasses(updatedSchedules);
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
      setClasses(userSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchedulesToCloud = async (updatedSchedules: ClassItem[]) => {
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
    if (offlineReady && classes.length > 0) {
      classes.forEach(async (schedule) => {
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
  }, [classes, offlineReady]);

  const createClass = async () => {
    if (!newClass.name || !newClass.day || !newClass.startTime || !newClass.endTime) return;
    
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const classItem: ClassItem = {
      id: scheduleId,
      ...newClass,
      createdAt: new Date(),
      lastModified: Date.now(),
    };

    try {
      // Schedule reminder if enabled
      if (newClass.hasReminder && newClass.isRecurring) {
        // For recurring schedules, we need to schedule for each occurrence
        const dayIndex = DAYS.indexOf(newClass.day);
        const reminderId = await notificationScheduler.scheduleRecurringScheduleReminder(
          { ...classItem, subject: newClass.name, date: '', time: newClass.startTime },
          newClass.reminderMinutes,
          [dayIndex]
        );
        classItem.reminderId = reminderId;
      }

      // Add to local state
      const updatedSchedules = [...classes, classItem];
      setClasses(updatedSchedules);

      // Save to offline storage
      if (offlineReady) {
        await offlineDB.addSchedule(classItem);
      }

      // Auto-save to cloud
      saveSchedulesToCloud(updatedSchedules);

      // Reset form
      setNewClass({
        name: '',
        organizer: '',
        location: '',
        day: '',
        startTime: '',
        endTime: '',
        color: 'bg-primary',
        hasReminder: false,
        reminderMinutes: 15,
        isRecurring: true
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const updateClass = async (id: string, updates: Partial<ClassItem>) => {
    const updatedClass = { 
      ...classes.find(cls => cls.id === id)!, 
      ...updates,
      lastModified: Date.now()
    };
    
    const updatedSchedules = classes.map(cls => 
      cls.id === id ? updatedClass : cls
    );
    setClasses(updatedSchedules);

    if (offlineReady) {
      await offlineDB.updateSchedule(updatedClass);
    }
    
    // Auto-save to cloud
    saveSchedulesToCloud(updatedSchedules);
  };

  const deleteClass = async (id: string) => {
    const classItem = classes.find(cls => cls.id === id);
    
    try {
      // Cancel any active reminders
      if (classItem?.reminderId) {
        await notificationScheduler.cancelReminder(classItem.reminderId);
      }

      const updatedSchedules = classes.filter(cls => cls.id !== id);
      setClasses(updatedSchedules);
      setEditingClass(null);

      // Remove from offline storage
      if (offlineReady) {
        await offlineDB.delete('schedules', id);
      }
      
      // Auto-save to cloud
      saveSchedulesToCloud(updatedSchedules);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      // Still update UI even if reminder cancellation failed
      const updatedSchedules = classes.filter(cls => cls.id !== id);
      setClasses(updatedSchedules);
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

  const getClassesForDay = (day: string) => {
    return classes
      .filter(cls => cls.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="h-4 w-4 animate-pulse" />
                <span className="hidden sm:inline">Auto-saving...</span>
              </div>
            )}
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
                    placeholder="Title"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="People"
                    value={newClass.organizer}
                    onChange={(e) => setNewClass(prev => ({ ...prev, organizer: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Location"
                    value={newClass.location}
                    onChange={(e) => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                    className="text-sm sm:text-base"
                  />
                  <Select value={newClass.day} onValueChange={(value) => setNewClass(prev => ({ ...prev, day: value }))}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newClass.startTime} onValueChange={(value) => setNewClass(prev => ({ ...prev, startTime: value }))}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newClass.endTime} onValueChange={(value) => setNewClass(prev => ({ ...prev, endTime: value }))}>
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
                        checked={newClass.hasReminder}
                        onCheckedChange={(checked) => setNewClass(prev => ({ ...prev, hasReminder: checked }))}
                      />
                      <Label htmlFor="reminder-toggle" className="text-sm flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Enable Reminders
                      </Label>
                    </div>
                    
                    {newClass.hasReminder && (
                      <>
                        <Select 
                          value={newClass.reminderMinutes.toString()} 
                          onValueChange={(value) => setNewClass(prev => ({ ...prev, reminderMinutes: parseInt(value) }))}
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
                        <span className="text-xs text-muted-foreground">before class</span>
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
                        newClass.color === color && "ring-2 ring-offset-2 ring-ring"
                      )}
                      onClick={() => setNewClass(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewClass({
                        name: '', organizer: '', location: '', day: '',
                        startTime: '', endTime: '', color: 'bg-primary',
                        hasReminder: false, reminderMinutes: 15, isRecurring: true
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createClass} className="bg-accent">
                    Add Class
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
            <div className="overflow-x-auto">
              <div className="min-w-[280px] sm:min-w-[600px] lg:min-w-[800px]">
                {/* Header with days */}
                <div className="grid grid-cols-8 border-b border-border/20">
                  <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground bg-muted/30">
                    Time
                  </div>
                  {DAYS.slice(0, 7).map(day => (
                    <div key={day} className="p-2 sm:p-4 text-center border-l border-border/20">
                      <div className="font-medium text-xs sm:text-sm">{day.slice(0, 3)}</div>
                      <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{day.slice(0, 3)}</div>
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
                      
                      {/* Day columns */}
                      {DAYS.slice(0, 7).map(day => {
                        const dayClasses = getClassesForDay(day).filter(cls => {
                          const classHour = parseInt(cls.startTime.split(':')[0]);
                          return classHour === hour;
                        });
                        
                        return (
                          <div key={`${day}-${timeSlot}`} className="border-l border-border/10 p-0.5 sm:p-1 relative min-h-[60px] sm:min-h-[80px]">
                            {dayClasses.map(cls => (
                              <div 
                                key={cls.id}
                                className={cn(
                                  "transition-all duration-200 hover:shadow-sm cursor-pointer border-0 rounded p-1 sm:p-2 text-xs text-white m-0.5 sm:m-1 touch-manipulation",
                                  cls.color
                                )}
                                onClick={() => setEditingClass(editingClass === cls.id ? null : cls.id)}
                              >
                                <div className="font-medium truncate text-xs sm:text-sm leading-tight">{cls.name}</div>
                                <div className="text-xs opacity-90 truncate hidden sm:block">{cls.organizer}</div>
                                <div className="text-xs opacity-75 hidden sm:block">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</div>
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

      {/* Edit Modal for selected class */}
      {editingClass && classes.find(cls => cls.id === editingClass) && (
        <Card className="glass-modal shadow-large mx-2 sm:mx-0">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Edit Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {(() => {
              const cls = classes.find(c => c.id === editingClass);
              if (!cls) return null;
              
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
                      <Label htmlFor="day">Day</Label>
                      <Select value={cls.day} onValueChange={(value) => updateClass(cls.id, { day: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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