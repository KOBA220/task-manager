import React, { useMemo, useState } from 'react';
import MeetingCard from './MeetingCard';
import { getMeetingStatus } from '../utils/meetingHelpers';
import { projectColor } from '../utils/helpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const VIEWS = {
  upcoming: { label: 'これから', icon: 'ti-calendar-time', color: '#2563EB' },
  today: { label: '本日', icon: 'ti-clock', color: '#DC2626' },
  needsMinutes: { label: '議事録未記入', icon: 'ti-notes-off', color: '#D97706' },
  past: { label: '過去', icon: 'ti-history', color: '#64748B' },
};

const hasMeetingRecord = (meeting) => Boolean(
  (meeting.minutesMemo ?? meeting.minutes ?? '').trim() || meeting.dialogue?.length
);

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dateKeyFromValue = (value) => value ? value.slice(0, 10) : '';

const formatMeetingTime = (value) => {
  if (!value) return '時間未設定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '時間未設定';
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return '';
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
};

export default function MeetingWorkspace({ meetings, projects, projectColors, onBackToTasks, onShowSchedule, onAdd, onEdit, onDelete, onConvertAction }) {
  const [view, setView] = useState('upcoming');
  const [filterProject, setFilterProject] = useState('all');
  const [search, setSearch] = useState('');
  const today = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const categorized = useMemo(() => ({
    upcoming: meetings.filter((meeting) => ['upcoming', 'unscheduled'].includes(getMeetingStatus(meeting))),
    today: meetings.filter((meeting) => getMeetingStatus(meeting) === 'today'),
    needsMinutes: meetings.filter((meeting) => getMeetingStatus(meeting) === 'past' && !hasMeetingRecord(meeting)),
    past: meetings.filter((meeting) => getMeetingStatus(meeting) === 'past'),
  }), [meetings]);

  const filtered = useMemo(() => {
    let list = categorized[view] || [];
    if (filterProject !== 'all') list = list.filter((meeting) => (meeting.project || '未分類') === filterProject);
    if (search.trim()) {
      const keyword = search.toLowerCase();
      list = list.filter((meeting) => {
        const participantText = (meeting.participants || []).map((participant) => [participant.name, participant.company, participant.department].join(' ')).join(' ');
        const dialogueText = (meeting.dialogue || []).map((entry) => [entry.speakerName, entry.text].join(' ')).join(' ');
        return [meeting.title, meeting.project, meeting.attendees, participantText, meeting.agenda, meeting.minutesMemo, meeting.minutes, dialogueText]
          .some((value) => (value || '').toLowerCase().includes(keyword));
      });
    }
    return [...list].sort((a, b) => {
      if (!a.startAt && !b.startAt) return (b.createdAt || 0) - (a.createdAt || 0);
      if (!a.startAt) return 1;
      if (!b.startAt) return -1;
      return view === 'past' || view === 'needsMinutes'
        ? new Date(b.startAt) - new Date(a.startAt)
        : new Date(a.startAt) - new Date(b.startAt);
    });
  }, [categorized, filterProject, search, view]);

  const grouped = filtered.reduce((groups, meeting) => {
    const project = meeting.project || '未分類';
    if (!groups[project]) groups[project] = [];
    groups[project].push(meeting);
    return groups;
  }, {});

  const projectOrder = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ja'));
  const todayMeetings = useMemo(() => [...categorized.today].sort((a, b) => (a.startAt || '').localeCompare(b.startAt || '')), [categorized.today]);

  const meetingsByDate = useMemo(() => {
    const map = {};
    meetings.forEach((meeting) => {
      const dateKey = dateKeyFromValue(meeting.startAt);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(meeting);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || '')));
    return map;
  }, [meetings]);

  const selectedMeetings = meetingsByDate[selectedDate] || [];

  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  }, [calendarMonth, calendarYear]);

  const prevCalendarMonth = () => {
    if (calendarMonth === 0) { setCalendarYear((year) => year - 1); setCalendarMonth(11); }
    else setCalendarMonth((month) => month - 1);
  };

  const nextCalendarMonth = () => {
    if (calendarMonth === 11) { setCalendarYear((year) => year + 1); setCalendarMonth(0); }
    else setCalendarMonth((month) => month + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 20px 50px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 750 }}>仕事管理</h1>
            <p style={{ marginTop: 2, color: 'var(--text3)', fontSize: 11 }}>案件に紐づく会議予定と議事録</p>
          </div>

          <nav style={{ marginLeft: 20, display: 'flex', padding: 3, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)' }}>
            <button onClick={onBackToTasks} style={navButtonStyle(false)}><i className="ti ti-list-check" /> タスク</button>
            <button style={navButtonStyle(true)}><i className="ti ti-users" /> 会議</button>
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={onShowSchedule} style={secondaryButtonStyle}><i className="ti ti-chart-gantt" /> 全体スケジュール</button>
            <button onClick={onAdd} style={primaryButtonStyle}><i className="ti ti-plus" /> 会議を追加</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 9, marginBottom: 18 }}>
          {Object.entries(VIEWS).map(([key, meta]) => (
            <button key={key} onClick={() => setView(key)} style={{ padding: '12px 14px', border: `1px solid ${view === key ? meta.color : 'var(--border)'}`, borderRadius: 9, background: view === key ? `${meta.color}10` : 'var(--surface)', textAlign: 'left', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)', fontSize: 10, fontWeight: 700 }}><i className={`ti ${meta.icon}`} /> {meta.label}</span>
              <strong style={{ display: 'block', marginTop: 3, color: meta.color, fontSize: 25 }}>{categorized[key].length}</strong>
            </button>
          ))}
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 0.9fr)', gap: 14, marginBottom: 18 }}>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={{ fontSize: 14 }}><i className="ti ti-calendar-month" /> 会議カレンダー</h2>
                <p style={{ marginTop: 2, color: 'var(--text3)', fontSize: 10 }}>過去にいつ、なんの会議をしたかを日付から確認できます</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={prevCalendarMonth} style={calendarNavButtonStyle}><i className="ti ti-chevron-left" /></button>
                <strong style={{ minWidth: 92, textAlign: 'center', fontSize: 13 }}>{calendarYear}年 {calendarMonth + 1}月</strong>
                <button onClick={nextCalendarMonth} style={calendarNavButtonStyle}><i className="ti ti-chevron-right" /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
              {WEEKDAYS.map((day, index) => (
                <div key={day} style={{ padding: '6px 4px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textAlign: 'center', color: index === 0 ? 'var(--danger)' : index === 6 ? '#2563EB' : 'var(--text2)', fontSize: 10, fontWeight: 800 }}>{day}</div>
              ))}
              {calendarWeeks.flatMap((week) => week).map((dateKey, index) => {
                const dayMeetings = dateKey ? meetingsByDate[dateKey] || [] : [];
                const isToday = dateKey === toDateKey(today);
                const selected = dateKey === selectedDate;
                return (
                  <button
                    key={`${dateKey || 'empty'}-${index}`}
                    onClick={() => dateKey && setSelectedDate(dateKey)}
                    disabled={!dateKey}
                    style={{
                      minHeight: 72, padding: 5, border: 'none', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                      background: !dateKey ? 'var(--surface2)' : selected ? '#FFF7ED' : isToday ? 'var(--accent-light)' : 'var(--surface)',
                      cursor: dateKey ? 'pointer' : 'default', textAlign: 'left', outline: selected ? '2px solid #FB923C' : 'none', outlineOffset: -2,
                    }}
                  >
                    {dateKey && (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: isToday ? 'var(--accent)' : '#fff', color: isToday ? '#fff' : 'var(--text1)', fontSize: 11, fontWeight: 800 }}>{Number(dateKey.slice(-2))}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                          {dayMeetings.slice(0, 3).map((meeting) => {
                            const color = projectColor(meeting.project || '未分類', projectColors);
                            return (
                              <span key={meeting.id} title={`${meeting.project || '未分類'}：${meeting.title}`} style={{ display: 'block', padding: '2px 5px', borderRadius: 5, background: `${color}18`, borderLeft: `3px solid ${color}`, color: 'var(--text1)', fontSize: 9, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formatMeetingTime(meeting.startAt)} {meeting.title}
                              </span>
                            );
                          })}
                          {dayMeetings.length > 3 && <span style={{ color: 'var(--text3)', fontSize: 9 }}>+{dayMeetings.length - 3}件</span>}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)' }}>
              <strong style={{ display: 'block', marginBottom: 7, fontSize: 12 }}>{formatDateLabel(selectedDate)} の会議</strong>
              {selectedMeetings.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 11 }}>この日の会議はありません</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedMeetings.map((meeting) => {
                    const color = projectColor(meeting.project || '未分類', projectColors);
                    return (
                      <button key={meeting.id} onClick={() => onEdit(meeting)} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: 8, padding: 8, border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 7, background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 800 }}>{formatMeetingTime(meeting.startAt)}</span>
                        <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.title}</strong><small style={{ color: 'var(--text3)' }}>{meeting.project || '未分類'}</small></span>
                        <i className="ti ti-pencil" style={{ color: 'var(--text3)' }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={{ fontSize: 14 }}><i className="ti ti-bell-ringing" /> 本日の会議</h2>
                <p style={{ marginTop: 2, color: 'var(--text3)', fontSize: 10 }}>{toDateKey(today)} の予定</p>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: 99, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 800 }}>{todayMeetings.length}件</span>
            </div>
            {todayMeetings.length === 0 ? (
              <div style={{ padding: 22, border: '1px dashed var(--border2)', borderRadius: 9, color: 'var(--text3)', textAlign: 'center' }}>
                <i className="ti ti-mug" style={{ display: 'block', marginBottom: 6, fontSize: 30 }} />
                <p style={{ fontSize: 12 }}>本日の会議はありません</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayMeetings.map((meeting) => {
                  const color = projectColor(meeting.project || '未分類', projectColors);
                  return (
                    <button key={meeting.id} onClick={() => onEdit(meeting)} style={{ padding: 10, border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 9, background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 13 }}>{meeting.title}</strong>
                        <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 800 }}>{formatMeetingTime(meeting.startAt)}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', color: 'var(--text3)', fontSize: 10 }}>
                        <span><i className="ti ti-folder" /> {meeting.project || '未分類'}</span>
                        {meeting.location && <span><i className="ti ti-map-pin" /> {meeting.location}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 230 }}>
            <i className="ti ti-search" style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="会議名・参加者・議事録を検索" style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', fontSize: 12 }} />
          </div>
          <select value={filterProject} onChange={(event) => setFilterProject(event.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', fontSize: 12 }}>
            <option value="all">すべての案件</option>
            {projects.map((project) => <option key={project} value={project}>{project}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '65px 20px', border: '1px dashed var(--border2)', borderRadius: 12, background: 'var(--surface)', color: 'var(--text3)', textAlign: 'center' }}>
            <i className="ti ti-calendar-off" style={{ display: 'block', marginBottom: 8, fontSize: 42 }} />
            <p style={{ fontSize: 13 }}>該当する会議はありません</p>
            {view === 'upcoming' && <button onClick={onAdd} style={{ ...primaryButtonStyle, marginTop: 12 }}>最初の会議を追加</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(projectOrder.length, 1), 3)}, minmax(280px, 1fr))`, gap: 14, alignItems: 'start' }}>
            {projectOrder.map((project) => {
              const projectMeetings = grouped[project];
              const color = projectColor(project, projectColors);
              return (
                <section key={project} style={{ minWidth: 0, padding: 11, border: '1px solid var(--border)', borderTop: `4px solid ${color}`, borderRadius: 11, background: 'var(--surface2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <h2 style={{ minWidth: 0, flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project}</h2>
                    <span style={{ padding: '2px 7px', borderRadius: 99, background: '#fff', color: 'var(--text3)', fontSize: 10, fontWeight: 800 }}>{projectMeetings.length}件</span>
                  </div>
                  {projectMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} projectColors={projectColors} onEdit={onEdit} onDelete={onDelete} onConvertAction={onConvertAction} />
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const navButtonStyle = (active) => ({
  padding: '7px 14px', border: 'none', borderRadius: 6, background: active ? 'var(--surface)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text3)', boxShadow: active ? 'var(--shadow-sm)' : 'none', cursor: active ? 'default' : 'pointer', fontSize: 12, fontWeight: 700,
});

const secondaryButtonStyle = { padding: '8px 12px', border: '1px solid var(--accent-mid)', borderRadius: 7, background: 'var(--surface)', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 700 };
const primaryButtonStyle = { padding: '8px 14px', border: 'none', borderRadius: 7, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 };
const panelStyle = { padding: 14, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' };
const panelHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 };
const calendarNavButtonStyle = { width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface2)', color: 'var(--text2)', cursor: 'pointer' };
