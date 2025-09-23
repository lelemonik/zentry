import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  color: string;
}

const COLORS = [
  'bg-gray-100',
  'hsl(var(--color-pink))',
  'hsl(var(--color-blue))',
  'hsl(var(--color-purple))',
  'hsl(var(--color-green))',
  'hsl(var(--color-yellow))',
  'hsl(var(--color-orange))',
  'hsl(var(--primary))',
];

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      color: selectedColor,
    };
    
    setTasks([task, ...tasks]);
    setNewTask('');
    setIsCreating(false);
    setSelectedColor(COLORS[0]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
        <Button
          onClick={() => setIsCreating(true)}
          size="icon"
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Task Form */}
      {isCreating && (
        <Card className="p-4 shadow-card animate-scale-in">
          <div className="space-y-4">
            {/* Color Picker */}
            <div className="flex gap-2">
              {COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    selectedColor === color ? "border-primary scale-110" : "border-transparent",
                    color.startsWith('hsl') ? '' : color
                  )}
                  style={color.startsWith('hsl') ? { backgroundColor: color } : {}}
                />
              ))}
            </div>

            {/* Input */}
            <Input
              placeholder="Enter task title"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="border-0 bg-muted/50 focus:bg-muted"
              autoFocus
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewTask('');
                  setSelectedColor(COLORS[0]);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addTask}
                className="bg-primary text-primary-foreground"
              >
                Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <Card
            key={task.id}
            className={cn(
              "p-4 shadow-card transition-all duration-200 hover:shadow-medium animate-slide-up",
              task.completed && "opacity-60"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Color Indicator */}
              <div
                className="h-4 w-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: task.color.startsWith('hsl') ? task.color : undefined
                }}
                {...(task.color.startsWith('bg-') && { className: task.color })}
              />

              {/* Task Content */}
              <div className="flex-1 flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    task.completed 
                      ? "bg-success border-success text-white" 
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  )}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </button>

                <span 
                  className={cn(
                    "text-sm font-medium transition-all",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </span>
              </div>

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask(task.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}

        {tasks.length === 0 && !isCreating && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs">Tap the + button to create your first task</p>
          </div>
        )}
      </div>
    </div>
  );
}