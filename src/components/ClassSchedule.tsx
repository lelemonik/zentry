import React, { useState, useEffect } from 'react';
import { Plus, Clock, MapPin, BookOpen, Edit2, Trash2, Calendar, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePersistedState } from '@/hooks/use-local-storage';
import { offlineDB, initOfflineDB } from '@/lib/offline-db';
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
  const [classes, setClasses] = usePersistedState<ClassItem[]>('classes', []);
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
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

  // Initialize offline storage and notification system
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await initOfflineDB();
        await notificationScheduler.initialize();
        setOfflineReady(true);
        
        // Sync schedules from IndexedDB if available
        if (classes.length === 0) {
          const offlineSchedules = await offlineDB.getSchedules();
          if (offlineSchedules.length > 0) {
            setClasses(offlineSchedules);
          }
        }
      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
      }
    };
    
    initializeOffline();
  }, []);

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
      setClasses([...classes, classItem]);

      // Save to offline storage
      if (offlineReady) {
        await offlineDB.addSchedule(classItem);
      }

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
    
    setClasses(classes.map(cls => 
      cls.id === id ? updatedClass : cls
    ));

    if (offlineReady) {
      await offlineDB.updateSchedule(updatedClass);
    }
  };

  const deleteClass = async (id: string) => {
    const classItem = classes.find(cls => cls.id === id);
    
    try {
      // Cancel any active reminders
      if (classItem?.reminderId) {
        await notificationScheduler.cancelReminder(classItem.reminderId);
      }

      setClasses(classes.filter(cls => cls.id !== id));
      setEditingClass(null);

      // Remove from offline storage
      if (offlineReady) {
        await offlineDB.delete('schedules', id);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      // Still update UI even if reminder cancellation failed
      setClasses(classes.filter(cls => cls.id !== id));
      setEditingClass(null);
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

      setClasses(classes.map(cls => cls.id === id ? updatedClass : cls));

      if (offlineReady) {
        await offlineDB.updateSchedule(updatedClass);
      }
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
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            My Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>

          {isCreating && (
            <Card className="mt-4 border-2 border-accent animate-slide-up">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Class name"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Organizer"
                    value={newClass.organizer}
                    onChange={(e) => setNewClass(prev => ({ ...prev, organizer: e.target.value }))}
                  />
                  <Input
                    placeholder="Location"
                    value={newClass.location}
                    onChange={(e) => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <Select value={newClass.day} onValueChange={(value) => setNewClass(prev => ({ ...prev, day: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newClass.startTime} onValueChange={(value) => setNewClass(prev => ({ ...prev, startTime: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map(time => (
                        <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newClass.endTime} onValueChange={(value) => setNewClass(prev => ({ ...prev, endTime: value }))}>
                    <SelectTrigger>
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

      <div className="grid gap-4">
        {DAYS.map(day => {
          const dayClasses = getClassesForDay(day);
          return (
            <Card key={day} className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {dayClasses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No classes scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map(cls => (
                      <Card 
                        key={cls.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-medium cursor-pointer",
                          cls.color, "text-white"
                        )}
                        onClick={() => setEditingClass(editingClass === cls.id ? null : cls.id)}
                      >
                        <CardContent className="p-4">
                          {editingClass === cls.id ? (
                            <div className="space-y-3 text-foreground" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  value={cls.name}
                                  onChange={(e) => updateClass(cls.id, { name: e.target.value })}
                                  placeholder="Class name"
                                />
                                <Input
                                  value={cls.organizer}
                                  onChange={(e) => updateClass(cls.id, { organizer: e.target.value })}
                                  placeholder="Organizer"
                                />
                                <Input
                                  value={cls.location}
                                  onChange={(e) => updateClass(cls.id, { location: e.target.value })}
                                  placeholder="Location"
                                />
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
                              
                              <div className="flex gap-2">
                                {COLORS.map(color => (
                                  <button
                                    key={color}
                                    className={cn(
                                      "w-6 h-6 rounded-full transition-all",
                                      color,
                                      cls.color === color && "ring-2 ring-white"
                                    )}
                                    onClick={() => updateClass(cls.id, { color })}
                                  />
                                ))}
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingClass(null)}
                                >
                                  Done
                                </Button>
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteClass(cls.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{cls.name}</h4>
                                <div className="flex items-center gap-4 text-sm opacity-90 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                  </div>
                                  {cls.organizer && (
                                    <span>{cls.organizer}</span>
                                  )}
                                  {cls.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {cls.location}
                                    </div>
                                  )}
                                  {cls.hasReminder && (
                                    <div className="flex items-center gap-1">
                                      <Bell className="h-3 w-3" />
                                      <span className="text-xs">{cls.reminderMinutes}min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "text-white hover:bg-white/20 h-8 w-8 p-0",
                                    cls.hasReminder && "bg-white/20"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleClassReminder(cls.id);
                                  }}
                                  title={cls.hasReminder ? "Disable reminder" : "Enable reminder"}
                                >
                                  {cls.hasReminder ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingClass(cls.id);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}