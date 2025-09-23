import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const createNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title || 'Untitled Note',
      content: newNote.content,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '' });
    setIsCreating(false);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    setEditingNote(null);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            What are your thoughts today?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-secondary hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>

          {isCreating && (
            <Card className="border-2 border-secondary animate-slide-up">
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="font-medium"
                />
                <Textarea
                  placeholder="Write your note here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewNote({ title: '', content: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={createNote}
                    className="bg-secondary"
                  >
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card 
            key={note.id}
            className={cn(
              "shadow-soft transition-all duration-200 hover:shadow-medium cursor-pointer",
              editingNote === note.id && "ring-2 ring-secondary"
            )}
            onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
          >
            <CardContent className="p-4">
              {editingNote === note.id ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className="font-medium"
                  />
                  <Textarea
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    rows={6}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
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
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-2">{note.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note.id);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-4">
                    {note.content || 'No content...'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {formatDate(note.updatedAt)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredNotes.length === 0 && !isCreating && (
          <Card className="shadow-soft md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No notes found matching your search.' : 'No notes yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}