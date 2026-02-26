import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveMeeting, Meeting } from '@/lib/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const title = (formData.get('title') as string) || 'Untitled Meeting';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text;
    const meetingId = `meeting-${Date.now()}`;
    const duration = Math.round((audioFile.size / 32000) * 8); // Approximate duration

    // Create meeting object with placeholder analysis
    const meeting: Meeting = {
      id: meetingId,
      title,
      date: new Date().toISOString(),
      duration,
      transcript,
      summary: '',
      actionItems: [],
      sentiment: {
        overall: 'neutral',
        score: 0,
      },
    };

    // Save the meeting with transcript
    saveMeeting(meeting);

    return NextResponse.json({
      success: true,
      meetingId,
      transcript,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Transcription failed: ' + errorMessage },
      { status: 500 }
    );
  }
}
