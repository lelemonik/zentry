import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClassItem {
  id: string;
  name: string;
  instructor?: string;
  location?: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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

export default function ClassSchedule() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    location: '',
    startTime: '',
    endTime: '',
  });

  const createClass = () => {
    if (!newClass.name.trim() || selectedDays.length === 0 || !newClass.startTime || !newClass.endTime) return;
    
    const newClasses = selectedDays.map(day => ({
      id: `${Date.now()}-${day}`,
      ...newClass,
      day,
      color: selectedColor,
    }));
    
    setClasses([...classes, ...newClasses]);
    setNewClass({ name: '', instructor: '', location: '', startTime: '', endTime: '' });
    setSelectedDays([]);
    setSelectedColor(COLORS[0]);
    setIsCreating(false);
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter(cls => cls.id !== id));
  };

  const getClassesForDay = (day: string) => {
    return classes
      .filter(cls => cls.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Class Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          size="icon"
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Class Form */}
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

            {/* Class Details */}
            <div className="space-y-3">
              <Input
                placeholder="Enter schedule title"
                value={newClass.name}
                onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                className="border-0 bg-muted/50 focus:bg-muted font-medium"
              />
              <Input
                placeholder="Enter instructor's name (Optional)"
                value={newClass.instructor}
                onChange={(e) => setNewClass(prev => ({ ...prev, instructor: e.target.value }))}
                className="border-0 bg-muted/50 focus:bg-muted"
              />
              <Input
                placeholder="Enter room location (Optional)"
                value={newClass.location}
                onChange={(e) => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                className="border-0 bg-muted/50 focus:bg-muted"
              />
            </div>

            {/* Day Selection */}
            <div>
              <p className="text-sm font-medium mb-2">Schedules</p>
              <div className="flex gap-2 mb-3">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                      selectedDays.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">⏰ Start Time</p>
                <Input
                  type="time"
                  value={newClass.startTime}
                  onChange={(e) => setNewClass(prev => ({ ...prev, startTime: e.target.value }))}
                  className="border-0 bg-muted/50 focus:bg-muted"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">⏰ End Time</p>
                <Input
                  type="time"
                  value={newClass.endTime}
                  onChange={(e) => setNewClass(prev => ({ ...prev, endTime: e.target.value }))}
                  className="border-0 bg-muted/50 focus:bg-muted"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewClass({ name: '', instructor: '', location: '', startTime: '', endTime: '' });
                  setSelectedDays([]);
                  setSelectedColor(COLORS[0]);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={createClass}
                className="bg-primary text-primary-foreground"
              >
                Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DAYS.map(day => {
          const dayClasses = getClassesForDay(day);
          const today = new Date().getDay();
          const dayIndex = DAYS.indexOf(day);
          const isToday = dayIndex === today;

          return (
            <Card key={day} className="p-4 shadow-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "font-medium text-sm",
                    isToday && "text-accent"
                  )}>
                    {day}
                  </h3>
                  {isToday && (
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>

                <div className="space-y-2">
                  {dayClasses.map((classItem, index) => (
                    <div
                      key={classItem.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all animate-slide-up group",
                        "hover:shadow-soft cursor-pointer"
                      )}
                      style={{
                        backgroundColor: classItem.color.startsWith('hsl') ? classItem.color : undefined,
                        animationDelay: `${index * 50}ms`
                      }}
                      {...(classItem.color.startsWith('bg-') && { className: `${classItem.color} p-3 rounded-lg border transition-all animate-slide-up group hover:shadow-soft cursor-pointer` })}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                          </div>
                          <h4 className="font-medium text-sm line-clamp-1">
                            {classItem.name}
                          </h4>
                          {classItem.instructor && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {classItem.instructor}
                            </p>
                          )}
                          {classItem.location && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              📍 {classItem.location}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteClass(classItem.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {dayClasses.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-xs">No classes</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}