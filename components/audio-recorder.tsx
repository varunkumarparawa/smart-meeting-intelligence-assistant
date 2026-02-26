'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, title: string) => void;
  isLoading?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  isLoading = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, title || 'Meeting');
        setTitle('');
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (e) => {
        toast.error('Recording error: ' + e.error);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (error: any) {
      let errorMessage = 'Failed to access microphone';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Could not access the microphone. It may be in use by another application.';
      }
      toast.error(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRecordingComplete(file, title || file.name.replace(/\.[^/.]+$/, ''));
      setTitle('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Meeting Title</label>
        <Input
          placeholder="e.g., Q4 Planning Meeting"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isRecording || isLoading}
        />
      </div>

      <div className="flex gap-3">
        {!isRecording ? (
          <>
            <Button
              onClick={startRecording}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                document.getElementById('file-upload')?.click()
              }
              disabled={isLoading}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Audio
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Recording ({formatTime(recordingTime)})
          </Button>
        )}
      </div>
    </div>
  );
}
