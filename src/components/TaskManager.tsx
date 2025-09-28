import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, Clock, Calendar, Search, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePersistedState } from '@/hooks/use-local-storage';
import { TaskSkeleton } from '@/components/ui/loading';
import { offlineDB, initOfflineDB } from '@/lib/offline-db';
import { notificationScheduler } from '@/lib/notification-scheduler';
import { responsiveClasses } from '@/lib/responsive-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  dueTime?: string;
  hasReminder: boolean;
  reminderMinutes: number; // Minutes before due date to show reminder
  reminderId?: string;
  createdAt: Date;
  lastModified?: number;
}

export default function TaskManager() {
  const [tasks, setTasks, isLoading] = usePersistedState<Task[]>('tasks', []);
  const [newTask, setNewTask] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [newTaskReminder, setNewTaskReminder] = useState(false);
  const [newTaskReminderMinutes, setNewTaskReminderMinutes] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [offlineReady, setOfflineReady] = useState(false);

  // Initialize offline storage and notification system
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await initOfflineDB();
        await notificationScheduler.initialize();
        setOfflineReady(true);
        
        // Sync tasks from IndexedDB if available
        if (tasks.length === 0) {
          const offlineTasks = await offlineDB.getTasks();
          if (offlineTasks.length > 0) {
            setTasks(offlineTasks);
          }
        }
      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
      }
    };
    
    initializeOffline();
  }, []);

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
      setTasks([task, ...tasks]);

      // Save to offline storage
      if (offlineReady) {
        await offlineDB.addTask(task);
      }

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

      setTasks(tasks.map(t => t.id === id ? updatedTask : t));

      // Update offline storage
      if (offlineReady) {
        await offlineDB.updateTask(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      // Still update UI even if reminder operation failed
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
    }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    
    try {
      // Cancel any active reminders
      if (task?.reminderId) {
        await notificationScheduler.cancelReminder(task.reminderId);
      }

      setTasks(tasks.filter(t => t.id !== id));

      // Remove from offline storage
      if (offlineReady) {
        await offlineDB.delete('tasks', id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      // Still update UI even if reminder cancellation failed
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateTask = (id: string, title: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, title } : task
    ));
    setEditingTask(null);
  };

  const updateTaskPriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ));
  };

  const updateTaskCategory = async (id: string, category: string) => {
    const updatedTask = { 
      ...tasks.find(t => t.id === id)!, 
      category,
      lastModified: Date.now()
    };
    
    setTasks(tasks.map(task => 
      task.id === id ? updatedTask : task
    ));

    if (offlineReady) {
      await offlineDB.updateTask(updatedTask);
    }
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

      setTasks(tasks.map(t => t.id === id ? updatedTask : t));

      if (offlineReady) {
        await offlineDB.updateTask(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling task reminder:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'active') return !task.completed && matchesSearch;
    if (filter === 'completed') return task.completed && matchesSearch;
    return matchesSearch;
  });

  const categories = Array.from(new Set([...tasks.map(task => task.category), 'General', 'Work', 'Study', 'Personal']));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      default: return 'bg-success';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Task Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Main task input row */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  className="flex-1"
                />
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTaskPriority(value)}>
                  <SelectTrigger className="w-24">
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
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={!newTask.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Due date and reminder row */}
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor="due-date" className="text-xs">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="due-time" className="text-xs">Due Time</Label>
                  <Input
                    id="due-time"
                    type="time"
                    value={newTaskDueTime}
                    onChange={(e) => setNewTaskDueTime(e.target.value)}
                    className="w-28"
                    disabled={!newTaskDueDate}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="reminder-toggle"
                    checked={newTaskReminder}
                    onCheckedChange={setNewTaskReminder}
                    disabled={!newTaskDueDate || !newTaskDueTime}
                  />
                  <Label htmlFor="reminder-toggle" className="text-xs flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Reminder
                  </Label>
                </div>
                {newTaskReminder && (
                  <Select 
                    value={newTaskReminderMinutes.toString()} 
                    onValueChange={(value) => setNewTaskReminderMinutes(parseInt(value))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={filter === filterType ? "bg-primary" : ""}
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
        <div className="space-y-3">
          {filteredTasks.map((task) => (
          <Card 
            key={task.id} 
            className={cn(
              "shadow-soft transition-all duration-200 hover:shadow-medium",
              task.completed && "opacity-60"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "h-6 w-6 rounded-full p-0",
                    task.completed ? "bg-success text-success-foreground" : "border-2 border-border"
                  )}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </Button>

                <div className="flex-1">
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
                          "text-sm font-medium block",
                          task.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {(task.dueDate || task.hasReminder) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString()}
                                {task.dueTime && ` at ${task.dueTime}`}
                              </span>
                            </div>
                          )}
                          {task.hasReminder && task.dueDate && (
                            <Badge variant="outline" className="text-xs h-5 px-1">
                              <Bell className="h-2 w-2 mr-1" />
                              {task.reminderMinutes}min
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select 
                    value={task.priority} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => updateTaskPriority(task.id, value)}
                  >
                    <SelectTrigger className="w-20 h-6 text-xs">
                      <Badge className={cn("text-xs border-0", getPriorityColor(task.priority))}>
                        {task.priority}
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
                    <SelectTrigger className="w-20 h-6 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {task.dueDate && task.dueTime && !task.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTaskReminder(task.id)}
                      className={cn(
                        "h-8 w-8 p-0 transition-colors",
                        task.hasReminder 
                          ? "text-primary hover:text-primary/80" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={task.hasReminder ? "Disable reminder" : "Enable reminder"}
                    >
                      {task.hasReminder ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTask(task.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

          {filteredTasks.length === 0 && (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
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