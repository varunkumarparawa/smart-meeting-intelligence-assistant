import { NextRequest, NextResponse } from 'next/server';
import { getMeeting } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = getMeeting(id);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve meeting' },
      { status: 500 }
    );
  }
}
