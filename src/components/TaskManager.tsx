import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, Clock, Calendar, Bell, BellOff, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAnimationClasses } from '@/hooks/use-animations';
import { autoSaveTasks, loadTasks, Task } from '@/lib/universal-sync';
import { TaskSkeleton } from '@/components/ui/loading';
import { offlineDB, initOfflineDB } from '../lib/offline-db';
import { notificationScheduler } from '@/lib/notification-scheduler';
import { responsiveClasses } from '@/lib/responsive-utils';

export default function TaskManager() {
  const { currentUser: user } = useAuth();
  const { preferences } = usePreferences();
  const { animationClasses } = useAnimationClasses();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskReminder, setNewTaskReminder] = useState(false);
  const [newTaskReminderMinutes, setNewTaskReminderMinutes] = useState(15);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [offlineReady, setOfflineReady] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserTasks();
      initializeOffline();
    } else {
      setTasks([]);
      setIsLoading(false);
    }
  }, [user]);

  // Listen for real-time updates from other devices
  useEffect(() => {
    if (!user) return;

    const handleTasksUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.uid) {
        console.log('📱 Received tasks update from another device');
        const updatedTasks = event.detail.data?.tasks || [];
        setTasks(updatedTasks);
      }
    };

    window.addEventListener('tasksUpdated', handleTasksUpdate as EventListener);
    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdate as EventListener);
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

  const loadUserTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTasks = await loadTasks(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasksToCloud = async (updatedTasks: Task[]) => {
    if (!user) return;

    try {
      setIsAutoSaving(true);
      await autoSaveTasks(user.uid, updatedTasks, 2000);
    } catch (error) {
      console.error('Failed to auto-save tasks:', error);
    } finally {
      // Reset auto-saving indicator after a delay
      setTimeout(() => setIsAutoSaving(false), 3000);
    }
  };

  // Sync tasks to IndexedDB when tasks change
  useEffect(() => {
    if (offlineReady && tasks.length > 0) {
      tasks.forEach(async (task) => {
        try {
          const existingTask = await offlineDB.get('tasks', task.id);
          if (existingTask) {
            await offlineDB.updateTask(task);
          } else {
            await offlineDB.addTask(task);
          }
        } catch (error) {
          console.error('Error syncing task to offline storage:', error);
        }
      });
    }
  }, [tasks, offlineReady]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: Task = {
      id: taskId,
      title: newTask,
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: newTaskDueDate || undefined,
      dueTime: newTaskDueTime || undefined,
      hasReminder: newTaskReminder,
      reminderMinutes: newTaskReminderMinutes,
      createdAt: new Date(),
      lastModified: Date.now(),
    };

    try {
      // Schedule reminder if enabled and due date is set
      if (newTaskReminder && newTaskDueDate && newTaskDueTime) {
        const reminderId = await notificationScheduler.scheduleTaskReminder(task, newTaskReminderMinutes);
        task.reminderId = reminderId;
      }

      // Add to local state
      const updatedTasks = [task, ...tasks];
      setTasks(updatedTasks);

      // Save to offline storage
      if (offlineReady) {
        await offlineDB.addTask(task);
      }

      // Auto-save to cloud
      saveTasksToCloud(updatedTasks);

      // Reset form
      setNewTask('');
      setNewTaskCategory('General');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setNewTaskDueTime('');
      setNewTaskReminder(false);
      setNewTaskReminderMinutes(15);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask = { 
      ...task, 
      completed: !task.completed,
      lastModified: Date.now()
    };

    try {
      // Cancel reminder if task is being completed
      if (!task.completed && updatedTask.completed && task.reminderId) {
        await notificationScheduler.cancelReminder(task.reminderId);
      }
      
      // Reschedule reminder if task is being uncompleted and has reminder settings
      else if (task.completed && !updatedTask.completed && task.hasReminder && task.dueDate && task.dueTime) {
        const reminderId = await notificationScheduler.scheduleTaskReminder(updatedTask, task.reminderMinutes);
        updatedTask.reminderId = reminderId;
      }

      const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
      setTasks(updatedTasks);

      // Update offline storage
      if (offlineReady) {
        await offlineDB.updateTask(updatedTask);
      }

      // Auto-save to cloud
      saveTasksToCloud(updatedTasks);
    } catch (error) {
      console.error('Error toggling task:', error);
      // Still update UI even if reminder operation failed
      const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
      setTasks(updatedTasks);
      saveTasksToCloud(updatedTasks);
    }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    try {
      // Cancel any active reminders
      if (task?.reminderId) {
        await notificationScheduler.cancelReminder(task.reminderId);
      }

      const updatedTasks = tasks.filter(t => t.id !== id);
      setTasks(updatedTasks);

      // Remove from offline storage
      if (offlineReady) {
        await offlineDB.delete('tasks', id);
      }

      // Auto-save to cloud
      saveTasksToCloud(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still update UI even if reminder cancellation failed
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, title: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, title, lastModified: Date.now() } : task
    );
    setTasks(updatedTasks);
    setEditingTask(null);
    
    // Auto-save to cloud
    saveTasksToCloud(updatedTasks);
  };

  const updateTaskPriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, priority, lastModified: Date.now() } : task
    );
    setTasks(updatedTasks);
    
    // Auto-save to cloud
    saveTasksToCloud(updatedTasks);
  };

  const updateTaskCategory = async (id: string, category: string) => {
    const updatedTask = { 
      ...tasks.find(t => t.id === id)!, 
      category,
      lastModified: Date.now()
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === id ? updatedTask : task
    );
    setTasks(updatedTasks);

    if (offlineReady) {
      await offlineDB.updateTask(updatedTask);
    }
    
    // Auto-save to cloud
    saveTasksToCloud(updatedTasks);
  };

  const toggleTaskReminder = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updatedTask = { 
        ...task, 
        hasReminder: !task.hasReminder,
        lastModified: Date.now()
      };

      if (!task.hasReminder && task.dueDate && task.dueTime && !task.completed) {
        // Enable reminder
        const reminderId = await notificationScheduler.scheduleTaskReminder(updatedTask, task.reminderMinutes);
        updatedTask.reminderId = reminderId;
      } else if (task.hasReminder && task.reminderId) {
        // Disable reminder
        await notificationScheduler.cancelReminder(task.reminderId);
        updatedTask.reminderId = undefined;
      }

      const updatedTasks = tasks.map(t => t.id === id ? updatedTask : t);
      setTasks(updatedTasks);

      if (offlineReady) {
        await offlineDB.updateTask(updatedTask);
      }
      
      // Auto-save to cloud
      saveTasksToCloud(updatedTasks);
    } catch (error) {
      console.error('Error toggling task reminder:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    // If showCompletedTasks is disabled, hide completed tasks unless explicitly filtering for them
    if (!preferences.showCompletedTasks && task.completed && filter !== 'completed') {
      return false;
    }
    
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const categories = Array.from(new Set([...tasks.map(task => task.category), 'General', 'Work', 'School', 'Personal']));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      default: return 'bg-success';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Card className="glass-card shadow-medium">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Task Manager
            </div>
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Auto-saving...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Main task input row - responsive layout */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  className="flex-1 text-sm sm:text-base"
                />
                <div className="flex gap-2 sm:gap-3">
                  <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                    <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTaskPriority(value)}>
                    <SelectTrigger className="w-full sm:w-24 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={addTask} 
                    className={cn(
                      "relative bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden",
                      animationClasses.transitionOpacity
                    )}
                    disabled={!newTask.trim()}
                  >
                    <div className="relative flex items-center gap-2">
                      <div className="bg-white/20 rounded-full p-1 group-hover:rotate-90 transition-transform duration-300">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Add Task</span>
                      {newTaskReminder && (
                        <Bell className="h-4 w-4 ml-1 animate-pulse text-warning" />
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                  </Button>
                </div>
              </div>

              {/* Due date and reminder row - responsive layout */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="due-date" className="text-xs sm:text-sm font-medium">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full sm:w-36 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="due-time" className="text-xs sm:text-sm font-medium">Due Time</Label>
                    <Input
                      id="due-time"
                      type="time"
                      value={newTaskDueTime}
                      onChange={(e) => setNewTaskDueTime(e.target.value)}
                      className="w-full sm:w-28 text-sm"
                      disabled={!newTaskDueDate}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                  <div className={cn(
                    "relative flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300",
                    newTaskReminder 
                      ? "bg-warning/10 border-warning shadow-md" 
                      : !newTaskDueDate || !newTaskDueTime 
                        ? "bg-muted border-border opacity-60" 
                        : "bg-card border-dashed border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  )}>
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                      newTaskReminder 
                        ? "bg-warning text-warning-foreground shadow-lg" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Bell className={cn(
                        "h-5 w-5 transition-all duration-300",
                        newTaskReminder && "animate-pulse"
                      )} />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="reminder-toggle" className="text-sm font-semibold text-gray-800 block cursor-pointer">
                        Set Reminder
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {!newTaskDueDate || !newTaskDueTime 
                          ? "Set due date and time first" 
                          : newTaskReminder 
                            ? "You'll be notified before the deadline" 
                            : "Get notified before your task is due"
                        }
                      </p>
                    </div>
                    <Switch
                      id="reminder-toggle"
                      checked={newTaskReminder}
                      onCheckedChange={setNewTaskReminder}
                      disabled={!newTaskDueDate || !newTaskDueTime}
                      className="data-[state=checked]:bg-warning"
                    />
                    {newTaskReminder && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                  {newTaskReminder && (
                    <div className="space-y-3 p-4 bg-warning/10 rounded-xl border-2 border-warning/30 shadow-sm">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Reminder Timing
                      </Label>
                      <Select 
                        value={newTaskReminderMinutes.toString()} 
                        onValueChange={(value) => setNewTaskReminderMinutes(parseInt(value))}
                      >
                        <SelectTrigger className="w-full sm:w-36 text-sm bg-card border-border focus:border-ring focus:ring-ring">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes before</SelectItem>
                          <SelectItem value="15">15 minutes before</SelectItem>
                          <SelectItem value="30">30 minutes before</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="1440">1 day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(['all', 'active', 'completed'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={cn(
                  "flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-2",
                  filter === filterType ? "bg-primary" : ""
                )}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <TaskSkeleton />
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredTasks.map((task) => (
          <Card 
            key={task.id} 
            className={cn(
              "glass-surface shadow-soft transition-all duration-200 hover:shadow-medium",
              task.completed && "opacity-60"
            )}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Top row: checkbox + task content */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex-shrink-0",
                      task.completed ? "bg-success text-success-foreground" : "border-2 border-border"
                    )}
                  >
                    {task.completed && <Check className="h-3 w-3" />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    {editingTask === task.id ? (
                      <Input
                        defaultValue={task.title}
                        onBlur={(e) => updateTask(task.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateTask(task.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                        className="text-sm"
                      />
                    ) : (
                      <div className="space-y-1">
                        <span 
                          className={cn(
                            "text-sm sm:text-base font-medium block break-words",
                            task.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                        {(task.dueDate || task.hasReminder) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                  {task.dueTime && ` at ${task.dueTime}`}
                                </span>
                              </div>
                            )}
                            {task.hasReminder && task.dueDate && (
                              <Badge                     className="text-xs h-6 px-3 flex-shrink-0 bg-warning text-warning-foreground border-0 shadow-md hover:shadow-lg transition-all duration-300 reminder-active">
                                <Bell className="h-3 w-3 mr-1.5 animate-pulse" />
                                Remind {task.reminderMinutes}min before
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: controls (responsive layout) */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-1 sm:ml-auto">
                  {/* Priority and Category - responsive width */}
                  <div className="flex gap-1 sm:gap-2">
                    <Select 
                      value={task.priority} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => updateTaskPriority(task.id, value)}
                    >
                      <SelectTrigger className="w-18 sm:w-24 h-6 text-xs px-1">
                        <Badge className={cn("text-xs border-0 px-1 py-0 h-4", getPriorityColor(task.priority))}>
                          <span className="truncate block min-w-0">
                            {task.priority}
                          </span>
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={task.category} 
                      onValueChange={(value) => updateTaskCategory(task.id, value)}
                    >
                      <SelectTrigger className="w-18 sm:w-24 h-6 text-xs px-1">
                        <Badge variant="outline" className="text-xs px-1 py-0 h-4 min-w-0 max-w-none overflow-hidden">
                          <span className="truncate block min-w-0">
                            {task.category}
                          </span>
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {task.dueDate && task.dueTime && !task.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskReminder(task.id)}
                        className={cn(
                          "relative h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95 group",
                          task.hasReminder 
                            ? "bg-warning text-warning-foreground shadow-lg hover:shadow-xl hover:opacity-90 reminder-active" 
                            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-2 border-dashed border-border hover:border-muted-foreground/30"
                        )}
                        title={task.hasReminder ? "Disable reminder" : "Enable reminder"}
                      >
                        <div className={cn(
                          "transition-all duration-300",
                          task.hasReminder && "animate-pulse"
                        )}>
                          {task.hasReminder ? (
                            <Bell className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm" />
                          ) : (
                            <BellOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </div>
                        {task.hasReminder && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full notification-dot"></div>
                        )}
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-500"></div>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

          {filteredTasks.length === 0 && (
            <Card className="glass-surface shadow-soft">
              <CardContent className="p-6 sm:p-8 text-center">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  {filter === 'all' ? 'No tasks yet. Add one above!' :
                   filter === 'active' ? 'No active tasks!' :
                   'No completed tasks!'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}