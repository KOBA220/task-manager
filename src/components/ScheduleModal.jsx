import React, { useMemo, useState } from 'react';
import { getMeetingStatus } from '../utils/meetingHelpers';
import { getTaskEnd, getTaskStatus, projectColor } from '../utils/helpers';

const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const taskDates = (task) => {
  const endAt = getTaskEnd(task);
  const start = (task.startAt || endAt || '').slice(0, 10);
  const end = (endAt || task.startAt || '').slice(0, 10);
  return start && end ? { start, end } : null;
};

const meetingDates = (meeting) => {
  const start = (meeting.startAt || meeting.endAt || '').slice(0, 10);
  const end = (meeting.endAt || meeting.startAt || '').slice(0, 10);
  return start && end ? { start, end } : null;
};

export default function ScheduleModal({ tasks, meetings = [], projects, projectColors, onClose, onEditTask, onEditMeeting }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStart = dateKey(viewYear, viewMonth, 1);
  const monthEnd = dateKey(viewYear, viewMonth, daysInMonth);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const allItems = useMemo(() => [
    ...tasks.map((task) => ({ id: `task-${task.id}`, type: 'task', data: task, project: task.project || '未分類', dates: taskDates(task) })),
    ...meetings.map((meeting) => ({ id: `meeting-${meeting.id}`, type: 'meeting', data: meeting, project: meeting.project || '未分類', dates: meetingDates(meeting) })),
  ], [meetings, tasks]);

  const filteredItems = allItems.filter((item) =>
    (filterProject === 'all' || item.project === filterProject) &&
    (filterType === 'all' || item.type === filterType)
  );

  const unscheduledTasks = filteredItems.filter((item) => item.type === 'task' && !item.dates && !item.data.completed);
  const visibleItems = filteredItems
    .filter((item) => item.dates && item.dates.start <= monthEnd && item.dates.end >= monthStart)
    .sort((a, b) => a.project.localeCompare(b.project, 'ja') || a.dates.start.localeCompare(b.dates.start) || a.data.title.localeCompare(b.data.title, 'ja'));

  const grouped = visibleItems.reduce((groups, item) => {
    if (!groups[item.project]) groups[item.project] = [];
    groups[item.project].push(item);
    return groups;
  }, {});

  const monthTasks = visibleItems.filter((item) => item.type === 'task').length;
  const monthMeetings = visibleItems.filter((item) => item.type === 'meeting').length;
  const overdueCount = tasks.filter((task) => getTaskStatus(task) === 'overdue').length;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((year) => year - 1); setViewMonth(11); }
    else setViewMonth((month) => month - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((year) => year + 1); setViewMonth(0); }
    else setViewMonth((month) => month + 1);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'var(--bg)', overflow: 'auto' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid var(--border)', background: 'rgba(247,246,242,0.96)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1580, margin: '0 auto', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 750 }}>全体スケジュール</h1>
            <p style={{ marginTop: 2, color: 'var(--text3)', fontSize: 10 }}>タスクの実施期間と会議予定を案件軸で確認</p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)} style={controlStyle}>
              <option value="all">タスク＋会議</option>
              <option value="task">タスクのみ</option>
              <option value="meeting">会議のみ</option>
            </select>
            <select value={filterProject} onChange={(event) => setFilterProject(event.target.value)} style={controlStyle}>
              <option value="all">すべての案件</option>
              {projects.map((project) => <option key={project} value={project}>{project}</option>)}
            </select>
            <button onClick={onClose} style={{ ...controlStyle, cursor: 'pointer' }}><i className="ti ti-x" /> 閉じる</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1580, margin: '0 auto', padding: '18px 20px 45px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
          <SummaryCard icon="ti-list-check" label="今月のタスク" value={monthTasks} color="var(--accent)" />
          <SummaryCard icon="ti-users" label="今月の会議" value={monthMeetings} color="#2563EB" />
          <SummaryCard icon="ti-alert-circle" label="期限切れ" value={overdueCount} color="var(--danger)" />
          <SummaryCard icon="ti-calendar-off" label="日程未設定" value={unscheduledTasks.length} color="var(--warn)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 13 }}>
          <button onClick={prevMonth} style={monthButtonStyle}><i className="ti ti-chevron-left" /></button>
          <strong style={{ minWidth: 130, textAlign: 'center', fontSize: 16 }}>{viewYear}年 {viewMonth + 1}月</strong>
          <button onClick={nextMonth} style={monthButtonStyle}><i className="ti ti-chevron-right" /></button>
          <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }} style={{ ...monthButtonStyle, width: 'auto', padding: '0 10px', fontSize: 10 }}>今月へ</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 7, color: 'var(--text3)', fontSize: 10 }}>
          <span><span style={{ display: 'inline-block', width: 22, height: 7, marginRight: 5, borderRadius: 4, background: 'var(--accent)' }} />タスク期間</span>
          <span><span style={{ display: 'inline-flex', width: 15, height: 15, marginRight: 5, border: '2px solid #2563EB', borderRadius: 5, alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}><i className="ti ti-users" style={{ fontSize: 8 }} /></span>会議予定</span>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ minWidth: 1220 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', position: 'relative', zIndex: 5, borderBottom: '2px solid var(--border2)', background: 'var(--surface2)' }}>
              <div style={{ padding: '8px 13px', borderRight: '1px solid var(--border)', color: 'var(--text2)', fontSize: 10, fontWeight: 700 }}>種類 / 案件 / 予定</div>
              <TimelineHeader days={days} viewYear={viewYear} viewMonth={viewMonth} today={today} />
            </div>

            {Object.keys(grouped).length === 0 ? (
              <div style={{ padding: 55, color: 'var(--text3)', textAlign: 'center', fontSize: 12 }}>この月に表示する予定はありません</div>
            ) : Object.entries(grouped).map(([project, items]) => {
              const color = projectColor(project, projectColors);
              return (
                <section key={project}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: `${color}12` }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <strong style={{ color, fontSize: 12 }}>{project}</strong>
                    <span style={{ color: 'var(--text3)', fontSize: 9 }}>{items.length}件</span>
                  </div>
                  {items.map((item) => (
                    <ScheduleRow
                      key={item.id}
                      item={item}
                      color={color}
                      days={days}
                      daysInMonth={daysInMonth}
                      monthStart={monthStart}
                      monthEnd={monthEnd}
                      viewYear={viewYear}
                      viewMonth={viewMonth}
                      today={today}
                      onClick={() => item.type === 'task' ? onEditTask(item.data) : onEditMeeting(item.data)}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        </div>

        {unscheduledTasks.length > 0 && (
          <section style={{ marginTop: 15, padding: 14, border: '1px solid #F5D9A0', borderRadius: 9, background: '#FFFBEB' }}>
            <h2 style={{ marginBottom: 8, color: 'var(--warn)', fontSize: 12 }}><i className="ti ti-calendar-off" /> 日程未設定のタスク</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {unscheduledTasks.map((item) => (
                <button key={item.id} onClick={() => onEditTask(item.data)} style={{ padding: '5px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', cursor: 'pointer', fontSize: 10 }}>
                  {item.project} · {item.data.title}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ScheduleRow({ item, color, days, daysInMonth, monthStart, monthEnd, viewYear, viewMonth, today, onClick }) {
  const startDay = item.dates.start < monthStart ? 1 : Number(item.dates.start.slice(-2));
  const endDay = item.dates.end > monthEnd ? daysInMonth : Number(item.dates.end.slice(-2));
  const isMeeting = item.type === 'meeting';
  const statusLabel = isMeeting
    ? ({ today: '本日', upcoming: '予定', past: '終了', unscheduled: '未設定' }[getMeetingStatus(item.data)])
    : ({ inProgress: '進行中', overdue: '期限切れ', completed: '完了', upcoming: 'これから' }[getTaskStatus(item.data)]);
  const timeLabel = isMeeting && item.data.startAt
    ? new Date(item.data.startAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: 43, borderBottom: '1px solid var(--border)' }}>
      <button onClick={onClick} style={{ minWidth: 0, padding: '6px 12px', border: 'none', borderRight: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'left', cursor: 'pointer' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className={`ti ${isMeeting ? 'ti-users' : 'ti-checkbox'}`} style={{ color: isMeeting ? '#2563EB' : color }} />
          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{item.data.title}</strong>
        </span>
        <span style={{ display: 'block', margin: '2px 0 0 21px', color: 'var(--text3)', fontSize: 9 }}>{isMeeting ? `会議 ${timeLabel}` : 'タスク'} · {statusLabel}</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysInMonth}, minmax(28px, 1fr))`, gridTemplateRows: '1fr', position: 'relative' }}>
        {days.map((day) => {
          const date = new Date(viewYear, viewMonth, day);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const current = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
          return <div key={day} style={{ gridColumn: day, gridRow: 1, borderRight: '1px solid var(--border)', background: current ? 'var(--accent-light)' : weekend ? 'var(--surface2)' : 'transparent' }} />;
        })}

        {isMeeting && startDay === endDay ? (
          <div title={`${item.data.title} ${timeLabel}`} style={{ gridColumn: startDay, gridRow: 1, zIndex: 3, alignSelf: 'center', justifySelf: 'stretch', height: 30, margin: '0 3px', border: `2px solid ${color}`, borderRadius: 7, background: '#fff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden', fontSize: 9, fontWeight: 800 }}>
            <i className="ti ti-users" /> {timeLabel}
          </div>
        ) : (
          <div title={`${item.dates.start} ～ ${item.dates.end}`} style={{ gridColumn: `${startDay} / ${endDay + 1}`, gridRow: 1, zIndex: 3, alignSelf: 'center', height: isMeeting ? 27 : 22, lineHeight: isMeeting ? '23px' : '22px', margin: '0 2px', padding: '0 7px', border: isMeeting ? `2px solid ${color}` : 'none', borderRadius: 6, background: isMeeting ? '#fff' : color, color: isMeeting ? color : '#fff', opacity: item.data.completed ? 0.48 : 0.92, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9, fontWeight: 700, textDecoration: item.data.completed ? 'line-through' : 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {isMeeting && <i className="ti ti-users" />} {item.data.title}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineHeader({ days, viewYear, viewMonth, today }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length}, minmax(28px, 1fr))` }}>
      {days.map((day) => {
        const date = new Date(viewYear, viewMonth, day);
        const weekday = date.getDay();
        const current = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
        return (
          <div key={day} style={{ minHeight: 38, padding: '5px 0', borderRight: '1px solid var(--border)', background: current ? 'var(--accent-light)' : 'transparent', textAlign: 'center' }}>
            <strong style={{ display: 'block', color: weekday === 0 ? 'var(--danger)' : weekday === 6 ? '#2563EB' : 'var(--text1)', fontSize: 11 }}>{day}</strong>
            <span style={{ color: 'var(--text3)', fontSize: 8 }}>{['日','月','火','水','木','金','土'][weekday]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ padding: '10px 13px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)', fontSize: 9, fontWeight: 700 }}><i className={`ti ${icon}`} /> {label}</span>
      <strong style={{ display: 'block', marginTop: 2, color, fontSize: 22 }}>{value}</strong>
    </div>
  );
}

const controlStyle = { padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text1)', fontSize: 11 };
const monthButtonStyle = { width: 31, height: 31, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer' };
