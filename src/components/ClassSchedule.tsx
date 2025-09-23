import React, { useState } from 'react';
import { Plus, Clock, MapPin, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLORS = [
  'bg-primary', 'bg-secondary', 'bg-accent', 'bg-success', 
  'bg-warning', 'bg-destructive'
];

export default function ClassSchedule() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    location: '',
    day: '',
    startTime: '',
    endTime: '',
    color: 'bg-primary'
  });

  const createClass = () => {
    if (!newClass.name || !newClass.day || !newClass.startTime || !newClass.endTime) return;
    
    const classItem: ClassItem = {
      id: Date.now().toString(),
      ...newClass,
    };
    
    setClasses([...classes, classItem]);
    setNewClass({
      name: '',
      instructor: '',
      location: '',
      day: '',
      startTime: '',
      endTime: '',
      color: 'bg-primary'
    });
    setIsCreating(false);
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => {
    setClasses(classes.map(cls => 
      cls.id === id ? { ...cls, ...updates } : cls
    ));
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter(cls => cls.id !== id));
    setEditingClass(null);
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
            <BookOpen className="h-5 w-5 text-accent" />
            Class Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Class
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
                    placeholder="Instructor"
                    value={newClass.instructor}
                    onChange={(e) => setNewClass(prev => ({ ...prev, instructor: e.target.value }))}
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
                        name: '', instructor: '', location: '', day: '',
                        startTime: '', endTime: '', color: 'bg-primary'
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
                                  value={cls.instructor}
                                  onChange={(e) => updateClass(cls.id, { instructor: e.target.value })}
                                  placeholder="Instructor"
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
                              <div>
                                <h4 className="font-semibold">{cls.name}</h4>
                                <div className="flex items-center gap-4 text-sm opacity-90 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                  </div>
                                  {cls.instructor && (
                                    <span>{cls.instructor}</span>
                                  )}
                                  {cls.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {cls.location}
                                    </div>
                                  )}
                                </div>
                              </div>
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