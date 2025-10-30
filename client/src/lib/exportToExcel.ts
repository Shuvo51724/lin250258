import * as XLSX from 'xlsx';
import { PerformanceEntry } from '@shared/schema';
import { format } from 'date-fns';

import type { ContentStatus } from '@/components/ContentStatusBadge';

const STATUS_LABELS: Record<ContentStatus, string> = {
  writing: '📝 Writing Processing',
  footage: '🎥 Footage Downloading',
  voiceover: '🎙️ Voice Over',
  thumbnail: '🖼️ Thumbnail Make',
  editing: '✂️ Editing',
  ready: '✅ Ready',
  alldone: '🚀 All Done',
  published: '🌐 Published',
};

export function exportToExcel(entries: PerformanceEntry[]) {
  const data = entries.map((entry, index) => ({
    'SL': index + 1,
    'Link': entry.link || '',
    'Title': entry.title || '',
    'Views': entry.views || '',
    'Reach': entry.reach || '',
    'Engagement': entry.engagement || '',
    'Voice Artist': entry.voiceArtist || '',
    'Script Writer': entry.scriptWriter || '',
    'Video Editor': entry.videoEditor || '',
    'Topic Selector': entry.topicSelector || '',
    'Mojo Reporter': entry.mojoReporter || '',
    'Jela Reporter': entry.jelaReporter || '',
    'Photo Card': entry.photoCard || '',
    'SEO': entry.seo || '',
    'Website News': entry.websiteNews || '',
    'Content Status': entry.contentStatus ? STATUS_LABELS[entry.contentStatus] || entry.contentStatus : '',
    'Created Date': format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  const colWidths = [
    { wch: 5 },  // SL
    { wch: 50 }, // Link
    { wch: 40 }, // Title
    { wch: 12 }, // Views
    { wch: 12 }, // Reach
    { wch: 12 }, // Engagement
    { wch: 20 }, // Voice Artist
    { wch: 20 }, // Script Writer
    { wch: 20 }, // Video Editor
    { wch: 20 }, // Topic Selector
    { wch: 20 }, // Mojo Reporter
    { wch: 20 }, // Jela Reporter
    { wch: 20 }, // Photo Card
    { wch: 15 }, // SEO
    { wch: 20 }, // Website News
    { wch: 25 }, // Content Status
    { wch: 20 }, // Created Date
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Data');

  const fileName = `DOB_Performance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
