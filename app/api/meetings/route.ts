import { NextRequest, NextResponse } from 'next/server';
import { listMeetings, deleteMeeting, getMeeting } from '@/lib/storage';

export async function GET() {
  try {
    const meetings = listMeetings();
    return NextResponse.json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.error('List meetings error:', error);
    return NextResponse.json(
      { error: 'Failed to list meetings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('id');

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      );
    }

    const deleted = deleteMeeting(meetingId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting deleted',
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
