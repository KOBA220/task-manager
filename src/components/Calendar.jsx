import React, { useState, useMemo } from 'react';
import { getTaskEnd, projectColor } from '../utils/helpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function Calendar({ tasks, onDayClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      const endAt = getTaskEnd(task);
      const startKey = (task.startAt || endAt || '').slice(0, 10);
      const endKey = (endAt || task.startAt || '').slice(0, 10);
      if (!startKey || !endKey) return;

      const cursor = new Date(`${startKey}T00:00:00`);
      const last = new Date(`${endKey}T00:00:00`);
      let safety = 0;
      while (cursor <= last && safety < 3660) {
        const key = toDateKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(task);
        cursor.setDate(cursor.getDate() + 1);
        safety += 1;
      }
    });
    return map;
  }, [tasks]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={navBtnStyle}><i className="ti ti-chevron-left" /></button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{viewYear}年 {viewMonth + 1}月</span>
        <button onClick={nextMonth} style={navBtnStyle}><i className="ti ti-chevron-right" /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
        {WEEKDAYS.map((day, i) => (
          <div key={day} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '5px 0', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: i === 0 ? 'var(--danger)' : i === 6 ? '#2563EB' : 'var(--text3)' }}>
            {day}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} style={emptyCellStyle} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === toDateKey(today);
          const dayTasks = tasksByDate[dateStr] || [];
          return (
            <button
              key={dateStr}
              onClick={() => dayTasks.length && onDayClick(dayTasks, dateStr)}
              style={{
                minHeight: 72, padding: '4px 3px', border: 'none', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                background: isToday ? 'var(--accent-light)' : 'var(--surface)', textAlign: 'left', overflow: 'hidden',
                cursor: dayTasks.length ? 'pointer' : 'default',
              }}
            >
              <span style={{ display: 'block', fontSize: 10, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent)' : 'var(--text2)', marginBottom: 3 }}>{day}</span>
              {dayTasks.slice(0, 3).map((task) => {
                const color = projectColor(task.project || '未分類');
                return (
                  <span key={task.id} title={`${task.project || '未分類'}：${task.title}`} style={{ display: 'block', fontSize: 8, lineHeight: '14px', height: 14, padding: '0 3px', marginBottom: 2, borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: `${color}1F`, borderLeft: `3px solid ${color}`, color: task.completed ? 'var(--text3)' : 'var(--text1)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                );
              })}
              {dayTasks.length > 3 && <span style={{ fontSize: 8, color: 'var(--text3)', paddingLeft: 3 }}>+{dayTasks.length - 3}件</span>}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>
        色は案件を表します。期間中の各日にタスクを表示します。
      </p>
    </div>
  );
}

const emptyCellStyle = {
  minHeight: 72, background: 'var(--surface2)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
};

const navBtnStyle = {
  padding: '4px 8px', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text2)', fontSize: 14,
};
