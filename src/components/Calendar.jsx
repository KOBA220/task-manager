import React, { useState, useMemo } from 'react';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function Calendar({ tasks, onDayClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks
      .filter((t) => t.dueDate && !t.completed)
      .forEach((t) => {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
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
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={navBtnStyle}><i className="ti ti-chevron-left" /></button>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{viewYear}年 {viewMonth + 1}月</span>
        <button onClick={nextMonth} style={navBtnStyle}><i className="ti ti-chevron-right" /></button>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, padding: '3px 0', color: i === 0 ? 'var(--danger)' : i === 6 ? '#2563EB' : 'var(--text3)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
          const dayTasks = tasksByDate[dateStr] || [];
          const hasTasks = dayTasks.length > 0;

          return (
            <div
              key={day}
              onClick={() => hasTasks && onDayClick(dayTasks, dateStr)}
              style={{
                aspectRatio: '1',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, cursor: hasTasks ? 'pointer' : 'default',
                background: isToday ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.1s',
                gap: 2, padding: 2,
                minHeight: 32,
              }}
              onMouseEnter={(e) => { if (hasTasks) e.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isToday ? 'var(--accent-light)' : 'transparent'; }}
            >
              <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text1)' }}>
                {day}
              </span>
              {dayTasks.length > 0 && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-mid)', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 5, height: 5, background: 'var(--accent-mid)', borderRadius: '50%' }} />
        タスクあり（クリックで詳細）
      </p>
    </div>
  );
}

const navBtnStyle = {
  padding: '4px 8px', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text2)', fontSize: 14,
};
