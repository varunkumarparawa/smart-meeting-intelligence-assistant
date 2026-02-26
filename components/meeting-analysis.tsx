'use client';

import { Meeting } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MeetingAnalysisProps {
  meeting: Meeting;
}

export function MeetingAnalysis({ meeting }: MeetingAnalysisProps) {
  const sentimentColor = {
    positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    neutral: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
        <p className="text-foreground/80 leading-relaxed">
          {meeting.summary || 'No summary available'}
        </p>
      </Card>

      {/* Action Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          Action Items
        </h3>
        {meeting.actionItems.length > 0 ? (
          <ul className="space-y-2">
            {meeting.actionItems.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-foreground/80">
                <span className="font-semibold text-accent min-w-fit">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground/60">No action items identified</p>
        )}
      </Card>

      {/* Sentiment Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Sentiment Analysis
        </h3>
        <div className="flex items-center gap-4">
          <Badge
            className={
              sentimentColor[
                meeting.sentiment.overall as keyof typeof sentimentColor
              ] || sentimentColor.neutral
            }
          >
            {meeting.sentiment.overall.charAt(0).toUpperCase() +
              meeting.sentiment.overall.slice(1)}
          </Badge>
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Confidence</span>
              <span className="text-sm font-medium">
                {Math.round(meeting.sentiment.score * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent rounded-full h-2 transition-all"
                style={{ width: `${meeting.sentiment.score * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Transcript */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Full Transcript</h3>
        <div className="bg-muted/50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
            {meeting.transcript}
          </p>
        </div>
      </Card>
    </div>
  );
}
