import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      priority: 'medium',
      category: 'General',
      createdAt: new Date(),
    };
    
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (id: string, title: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, title } : task
    ));
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

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
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="flex-1"
            />
            <Button 
              onClick={addTask} 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
            </Button>
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
                    <span 
                      className={cn(
                        "text-sm font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                    {task.priority}
                  </Badge>
                  
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
    </div>
  );
}