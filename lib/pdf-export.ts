import jsPDF from 'jspdf';
import { Meeting } from './storage';

export function exportMeetingToPDF(meeting: Meeting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to check and add new page
  const checkPageBreak = (height: number) => {
    if (yPosition + height > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(80, 120, 160);
  doc.text('Meeting Report', margin, yPosition);
  yPosition += 12;

  // Meeting Info
  doc.setFontSize(10);
  doc.setTextColor(100);
  const date = new Date(meeting.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Date: ${date}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Duration: ${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s`, margin, yPosition);
  yPosition += 10;

  // Summary Section
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text('Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(80);
  const summaryLines = doc.splitTextToSize(meeting.summary, contentWidth);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 8;

  // Action Items Section
  checkPageBreak(20);
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text('Action Items', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(80);
  if (meeting.actionItems.length > 0) {
    meeting.actionItems.forEach((item) => {
      checkPageBreak(8);
      const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
      doc.text(itemLines, margin + 5, yPosition);
      yPosition += itemLines.length * 5 + 2;
    });
  } else {
    doc.text('No action items identified', margin, yPosition);
    yPosition += 6;
  }
  yPosition += 2;

  // Sentiment Analysis
  checkPageBreak(15);
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text('Sentiment Analysis', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(
    `Overall Sentiment: ${meeting.sentiment.overall.charAt(0).toUpperCase() + meeting.sentiment.overall.slice(1)}`,
    margin,
    yPosition
  );
  yPosition += 6;
  doc.text(`Confidence: ${Math.round(meeting.sentiment.score * 100)}%`, margin, yPosition);
  yPosition += 10;

  // Transcript Section
  checkPageBreak(15);
  doc.setFontSize(14);
  doc.setTextColor(50);
  doc.text('Full Transcript', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setTextColor(80);
  const transcriptLines = doc.splitTextToSize(meeting.transcript, contentWidth);
  
  transcriptLines.forEach((line) => {
    checkPageBreak(5);
    doc.text(line, margin, yPosition);
    yPosition += 4;
  });

  // Save the PDF
  const filename = `${meeting.title.replace(/\s+/g, '_')}_${new Date(meeting.date).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
