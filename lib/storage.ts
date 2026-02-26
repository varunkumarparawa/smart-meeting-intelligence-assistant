import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'meetings');

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  transcript: string;
  summary: string;
  actionItems: string[];
  sentiment: {
    overall: string;
    score: number;
  };
  participants?: string[];
}

// Ensure data directory exists
export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Save meeting data
export function saveMeeting(meeting: Meeting): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${meeting.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(meeting, null, 2));
}

// Get meeting by ID
export function getMeeting(id: string): Meeting | null {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// List all meetings
export function listMeetings(): Meeting[] {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const data = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
    return JSON.parse(data);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Delete meeting
export function deleteMeeting(id: string): boolean {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
