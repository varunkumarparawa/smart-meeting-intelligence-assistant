import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getMeeting, saveMeeting } from '@/lib/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    const meeting = getMeeting(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Analyze transcript using GPT-4
    const analysisPrompt = `You are a professional meeting analyst. Analyze the following meeting transcript and provide:
1. A concise summary (2-3 sentences)
2. Key action items (as a numbered list)
3. Overall sentiment (positive, neutral, or negative) with a confidence score from 0-1

Format your response as JSON with the following structure:
{
  "summary": "...",
  "actionItems": ["item1", "item2", ...],
  "sentiment": "positive|neutral|negative",
  "sentimentScore": 0.8
}

Transcript:
${meeting.transcript}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from GPT-4');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from GPT-4');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Update meeting with analysis
    meeting.summary = analysis.summary;
    meeting.actionItems = analysis.actionItems || [];
    meeting.sentiment = {
      overall: analysis.sentiment,
      score: analysis.sentimentScore || 0.5,
    };

    saveMeeting(meeting);

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
