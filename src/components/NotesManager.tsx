import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, FileText, Tag, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { autoSaveNotes, loadNotes, Note } from '@/lib/universal-sync';
import { responsiveClasses } from '@/lib/responsive-utils';

export default function NotesManager() {
  const { currentUser: user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'General' });
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes when component mounts or user changes
  useEffect(() => {
    console.log('NotesManager: useEffect triggered, user:', user?.email || 'null');
    if (user) {
      console.log('NotesManager: Loading notes for user:', user.uid);
      loadUserNotes();
    } else {
      console.log('NotesManager: No user, setting empty notes');
      setNotes([]);
      setIsLoading(false);
    }
  }, [user]);

  // Listen for real-time updates from other devices
  useEffect(() => {
    if (!user) return;

    const handleNotesUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.uid) {
        console.log('📱 Received notes update from another device');
        const updatedNotes = event.detail.data?.notes || [];
        setNotes(updatedNotes);
      }
    };

    window.addEventListener('notesUpdated', handleNotesUpdate as EventListener);
    return () => {
      window.removeEventListener('notesUpdated', handleNotesUpdate as EventListener);
    };
  }, [user]);

  const loadUserNotes = async () => {
    if (!user) {
      console.log('NotesManager: loadUserNotes called but no user available');
      return;
    }
    
    try {
      console.log('NotesManager: Starting to load notes for user:', user.uid);
      setIsLoading(true);
      const userNotes = await loadNotes(user.uid);
      console.log('NotesManager: Loaded notes:', userNotes);
      setNotes(userNotes);
    } catch (error) {
      console.error('NotesManager: Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotesToCloud = async (updatedNotes: Note[]) => {
    if (!user) return;

    try {
      setIsAutoSaving(true);
      await autoSaveNotes(user.uid, updatedNotes, 2000);
    } catch (error) {
      console.error('Failed to auto-save notes:', error);
    } finally {
      // Reset auto-saving indicator after a delay
      setTimeout(() => setIsAutoSaving(false), 3000);
    }
  };

  const createNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title || 'Untitled Note',
      content: newNote.content,
      category: newNote.category,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    setNewNote({ title: '', content: '', category: 'General' });
    setIsCreating(false);
    
    // Auto-save to cloud
    saveNotesToCloud(updatedNotes);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );
    setNotes(updatedNotes);
    
    // Auto-save to cloud
    saveNotesToCloud(updatedNotes);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    setEditingNote(null);
    
    // Auto-save to cloud
    saveNotesToCloud(updatedNotes);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set([...notes.map(note => note.category), 'General', 'School', 'Work', 'Personal']));

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Card className="glass-card shadow-medium">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
              What are your thoughts today?
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
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 sm:w-40 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-secondary hover:opacity-90 transition-opacity px-3 sm:px-4"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Note</span>
              </Button>
            </div>
          </div>

          {isCreating && (
            <Card className="glass-surface border-2 border-secondary animate-slide-up">
              <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Input
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="font-medium flex-1 text-sm sm:text-base"
                  />
                  <Select 
                    value={newNote.category} 
                    onValueChange={(value) => setNewNote(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-full sm:w-32 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Write your note here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="text-sm sm:text-base"
                />
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewNote({ title: '', content: '', category: 'General' });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={createNote}
                    className="bg-secondary w-full sm:w-auto"
                  >
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredNotes.map((note) => (
          <Card 
            key={note.id}
            className={cn(
              "glass-surface shadow-soft transition-all duration-200 hover:shadow-medium cursor-pointer group",
              editingNote === note.id && "ring-2 ring-secondary"
            )}
            onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
          >
            <CardContent className="p-3 sm:p-4">
              {editingNote === note.id ? (
                <div className="space-y-3 sm:space-y-4" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    className="font-medium text-sm sm:text-base"
                  />
                  <Textarea
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    rows={4}
                    className="text-sm sm:text-base min-h-[100px]"
                  />
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingNote(null)}
                      className="w-full sm:w-auto"
                    >
                      Done
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-3 w-3 mr-1 sm:mr-0" />
                      <span className="sm:sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm sm:text-base line-clamp-2 min-w-0 flex-1">{note.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNote(note.id);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4 leading-relaxed">
                    {note.content || 'No content...'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {note.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {formatDate(note.updatedAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredNotes.length === 0 && !isCreating && (
          <Card className="glass-surface shadow-soft sm:col-span-2 lg:col-span-3">
            <CardContent className="p-6 sm:p-8 text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchTerm ? 'No notes found matching your search.' : 'No notes yet.'}
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      )}
    </div>
  );
}