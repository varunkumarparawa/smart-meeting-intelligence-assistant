'use client';

import { useState, useEffect } from 'react';
import { AudioRecorder } from '@/components/audio-recorder';
import { MeetingAnalysis } from '@/components/meeting-analysis';
import { Meeting } from '@/lib/storage';
import { exportMeetingToPDF } from '@/lib/pdf-export';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, Trash2, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, title: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('title', title);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error('Transcription failed: ' + errorText);
      }

      const data = await res.json();
      setSelectedMeetingId(data.meetingId);
      toast.success('Recording transcribed successfully!');

      // Trigger analysis
      setIsAnalyzing(true);
      const analysisRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: data.meetingId }),
      });

      if (!analysisRes.ok) throw new Error('Analysis failed');

      const analysisData = await analysisRes.json();
      setMeetings((prev) => {
        const existing = prev.find((m) => m.id === data.meetingId);
        if (existing) {
          return prev.map((m) =>
            m.id === data.meetingId ? analysisData.meeting : m
          );
        }
        return [analysisData.meeting, ...prev];
      });
      toast.success('Meeting analysis complete!');
    } catch (error) {
      console.error('Error processing meeting:', error);
      toast.error('Failed to process meeting');
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting?')) return;

    try {
      const res = await fetch(`/api/meetings?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      setMeetings((prev) => prev.filter((m) => m.id !== id));
      if (selectedMeetingId === id) setSelectedMeetingId(null);
      toast.success('Meeting deleted');
    } catch (error) {
      toast.error('Failed to delete meeting');
    }
  };

  const handleExportPDF = (meeting: Meeting) => {
    try {
      exportMeetingToPDF(meeting);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6">
          <h1 className="text-3xl font-bold text-foreground">
            Meeting Intelligence
          </h1>
          <p className="text-foreground/60 mt-1">
            AI-powered meeting transcription, analysis, and insights
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recording Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-6">New Meeting</h2>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isLoading={isLoading || isAnalyzing}
              />

              {isAnalyzing && (
                <div className="mt-6 p-4 bg-accent/10 rounded-lg flex items-center gap-2 text-accent">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing meeting...</span>
                </div>
              )}

              {/* Meetings History */}
              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold mb-4">Recent Meetings</h3>
                {meetings.length > 0 ? (
                  <div className="space-y-2">
                    {meetings.slice(0, 5).map((meeting) => (
                      <button
                        key={meeting.id}
                        onClick={() => setSelectedMeetingId(meeting.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedMeetingId === meeting.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="font-medium text-sm truncate">
                          {meeting.title}
                        </div>
                        <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(meeting.date).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground/60 text-sm">No meetings yet</p>
                )}
              </div>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2">
            {selectedMeeting ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      onClick={() => setSelectedMeetingId(null)}
                      className="flex items-center gap-2 text-accent hover:text-accent/80 mb-3"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <h2 className="text-2xl font-bold">{selectedMeeting.title}</h2>
                    <p className="text-foreground/60 mt-2">
                      {new Date(selectedMeeting.date).toLocaleString()} •{' '}
                      {Math.floor(selectedMeeting.duration / 60)}m{' '}
                      {selectedMeeting.duration % 60}s
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(selectedMeeting)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <MeetingAnalysis meeting={selectedMeeting} />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">🎙️</div>
                  <h3 className="text-xl font-semibold">
                    Start a New Meeting
                  </h3>
                  <p className="text-foreground/60 max-w-sm mx-auto">
                    Record or upload an audio file to begin. Our AI will
                    transcribe, analyze, and extract key insights from your
                    meeting.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
