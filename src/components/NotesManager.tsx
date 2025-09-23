import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
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

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const createNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title || 'Untitled',
      content: newNote.content,
      color: selectedColor,
      createdAt: new Date(),
    };
    
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '' });
    setIsCreating(false);
    setSelectedColor(COLORS[0]);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    setEditingNote(null);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Notes</h1>
        <Button
          onClick={() => setIsCreating(true)}
          size="icon"
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Note Form */}
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

            {/* Inputs */}
            <Input
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              className="border-0 bg-muted/50 focus:bg-muted font-medium"
            />
            <Textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="border-0 bg-muted/50 focus:bg-muted resize-none"
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: '', content: '' });
                  setSelectedColor(COLORS[0]);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={createNote}
                className="bg-primary text-primary-foreground"
              >
                Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notes Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {notes.map((note, index) => (
          <Card
            key={note.id}
            className={cn(
              "p-4 shadow-card transition-all duration-200 hover:shadow-medium cursor-pointer animate-slide-up",
              editingNote === note.id && "ring-2 ring-accent"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
          >
            {editingNote === note.id ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={note.title}
                  onChange={(e) => updateNote(note.id, { title: e.target.value })}
                  className="border-0 bg-muted/50 focus:bg-muted font-medium"
                />
                <Textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, { content: e.target.value })}
                  rows={6}
                  className="border-0 bg-muted/50 focus:bg-muted resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingNote(null)}
                  >
                    Done
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="h-4 w-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: note.color.startsWith('hsl') ? note.color : undefined
                    }}
                    {...(note.color.startsWith('bg-') && { className: note.color })}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{note.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                      {note.content || 'No content...'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {notes.length === 0 && !isCreating && (
          <div className="md:col-span-2 text-center py-12 text-muted-foreground">
            <p className="text-sm">No notes yet</p>
            <p className="text-xs">Tap the + button to create your first note</p>
          </div>
        )}
      </div>
    </div>
  );
}