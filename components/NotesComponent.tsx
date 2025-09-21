"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2 } from "lucide-react";
import { emit } from "@/utils/telemetry";

interface Note {
  id: string;
  content: string;
  timestamp: number;
  callId?: string;
  emailSent?: boolean;
}

interface NotesComponentProps {
  callId?: string;
  className?: string;
}

export default function NotesComponent({ callId, className = "" }: NotesComponentProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tami-notes');
      if (saved) {
        const parsedNotes = JSON.parse(saved) as Note[];
        setNotes(parsedNotes);
      }
    } catch {
      // Ignore localStorage errors
    }

    // Check email mode from environment
    const emailMode = process.env.NEXT_PUBLIC_EMAIL_MODE || 'on';
    setIsEmailEnabled(emailMode !== 'off');
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    try {
      localStorage.setItem('tami-notes', JSON.stringify(notes));
    } catch {
      // Ignore localStorage errors
    }
  }, [notes]);

  const addNote = async () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: Date.now(),
      callId: callId,
      emailSent: false
    };

    setNotes(prev => [note, ...prev]);
    setNewNote("");

    // Emit telemetry
    emit({ type: 'note_created', length: note.content.length });

    // Send email if enabled
    if (isEmailEnabled) {
      try {
        await sendNoteEmail(note);
        setNotes(prev => prev.map(n => 
          n.id === note.id ? { ...n, emailSent: true } : n
        ));
      } catch (error) {
        console.error('Failed to send note email:', error);
      }
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const sendNoteEmail = async (note: Note) => {
    // Simulate email sending - in real implementation, this would call an API
    const response = await fetch('/api/send-note-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `NOTE: ${note.content.slice(0, 50)}${note.content.length > 50 ? '...' : ''}`,
        content: note.content,
        timestamp: note.timestamp,
        callId: note.callId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notes</span>
          <Badge variant={isEmailEnabled ? "default" : "secondary"}>
            {isEmailEnabled ? "Email enabled" : "Email disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note about this call..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={addNote}
            disabled={!newNote.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
            {isEmailEnabled && <Mail className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Notes list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No notes yet. Add your first note above.
            </p>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className="p-3 border rounded-lg bg-muted/30 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm flex-1">{note.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTimestamp(note.timestamp)}</span>
                  <div className="flex items-center space-x-2">
                    {note.callId && (
                      <Badge variant="outline" className="text-xs">
                        Call: {note.callId.slice(-6)}
                      </Badge>
                    )}
                    {isEmailEnabled && (
                      <Badge 
                        variant={note.emailSent ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {note.emailSent ? "Emailed" : "Pending"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}