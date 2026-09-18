export const getMeetingStatus = (meeting, now = new Date()) => {
  const start = meeting.startAt ? new Date(meeting.startAt) : null;
  const end = meeting.endAt ? new Date(meeting.endAt) : start;
  if (!start) return 'unscheduled';

  const todayKey = now.toLocaleDateString('sv-SE');
  const meetingKey = start.toLocaleDateString('sv-SE');
  if (meetingKey === todayKey) return 'today';
  if (end && end < now) return 'past';
  return 'upcoming';
};

export const MEETING_STATUS = {
  today: { label: '本日', color: '#DC2626', bg: '#FEF2F2' },
  upcoming: { label: '予定', color: '#2563EB', bg: '#EFF6FF' },
  past: { label: '終了', color: '#64748B', bg: '#F1F5F9' },
  unscheduled: { label: '日時未設定', color: '#D97706', bg: '#FFFBEB' },
};

export const formatMeetingDate = (value) => value
  ? new Date(value).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
  : '';

