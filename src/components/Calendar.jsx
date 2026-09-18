import React, { useState, useMemo } from 'react';
import { getTaskEnd, projectColor } from '../utils/helpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const taskRange = (task) => {
  const endAt = getTaskEnd(task);
  const startKey = (task.startAt || endAt || '').slice(0, 10);
  const endKey = (endAt || task.startAt || '').slice(0, 10);
  return startKey && endKey ? { startKey, endKey } : null;
};

const assignLanes = (segments) => {
  const laneEnds = [];
  return [...segments]
    .sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol || a.task.title.localeCompare(b.task.title, 'ja'))
    .map((segment) => {
      let lane = laneEnds.findIndex((endCol) => segment.startCol > endCol);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = segment.endCol;
      return { ...segment, lane };
    });
};

export default function Calendar({ tasks, projectColors, onDayClick }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const scheduledTasks = useMemo(() => tasks
    .map((task) => ({ task, range: taskRange(task) }))
    .filter(({ range }) => range), [tasks]);

  const tasksByDate = useMemo(() => {
    const map = {};
    scheduledTasks.forEach(({ task, range }) => {
      const cursor = new Date(`${range.startKey}T00:00:00`);
      const last = new Date(`${range.endKey}T00:00:00`);
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
  }, [scheduledTasks]);

  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  }, [daysInMonth, firstDay, viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const visibleProjects = [...new Set(scheduledTasks.map(({ task }) => task.project || '未分類'))]
    .sort((a, b) => a.localeCompare(b, 'ja'));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={navBtnStyle}><i className="ti ti-chevron-left" /></button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{viewYear}年 {viewMonth + 1}月</span>
        <button onClick={nextMonth} style={navBtnStyle}><i className="ti ti-chevron-right" /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
        {WEEKDAYS.map((day, index) => (
          <div key={day} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '6px 0', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', color: index === 0 ? 'var(--danger)' : index === 6 ? '#2563EB' : 'var(--text2)' }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ borderLeft: '1px solid var(--border)' }}>
        {weeks.map((week, weekIndex) => {
          const rawSegments = scheduledTasks.flatMap(({ task, range }) => {
            const activeColumns = week
              .map((dateKey, column) => dateKey && dateKey >= range.startKey && dateKey <= range.endKey ? column : -1)
              .filter((column) => column >= 0);
            if (!activeColumns.length) return [];
            return [{ task, range, startCol: Math.min(...activeColumns), endCol: Math.max(...activeColumns) }];
          });
          const segments = assignLanes(rawSegments);
          const laneCount = Math.max(1, ...segments.map((segment) => segment.lane + 1));

          return (
            <div key={weekIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: `30px repeat(${laneCount}, 18px)`, minHeight: 52, position: 'relative' }}>
              {week.map((dateKey, column) => {
                if (!dateKey) return <div key={`empty-${column}`} style={{ gridColumn: column + 1, gridRow: `1 / ${laneCount + 2}`, background: 'var(--surface2)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />;
                const dayTasks = tasksByDate[dateKey] || [];
                const isToday = dateKey === toDateKey(today);
                return (
                  <button
                    key={dateKey}
                    onClick={() => dayTasks.length && onDayClick(dayTasks, dateKey)}
                    style={{
                      gridColumn: column + 1, gridRow: `1 / ${laneCount + 2}`, zIndex: 1,
                      padding: '4px 4px', border: 'none', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                      background: isToday ? 'var(--accent-light)' : 'var(--surface)', textAlign: 'left', cursor: dayTasks.length ? 'pointer' : 'default', position: 'relative',
                    }}
                  >
                    <span style={{ position: 'absolute', top: 4, left: 5, zIndex: 4, width: 21, height: 21, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday ? 800 : 650, color: isToday ? '#fff' : 'var(--text1)', background: isToday ? 'var(--accent)' : 'rgba(255,255,255,0.9)' }}>
                      {Number(dateKey.slice(-2))}
                    </span>
                  </button>
                );
              })}

              {segments.map(({ task, range, startCol, endCol, lane }) => {
                const project = task.project || '未分類';
                const color = projectColor(project, projectColors);
                const startsHere = week[startCol] === range.startKey;
                const endsHere = week[endCol] === range.endKey;
                return (
                  <div
                    key={task.id}
                    title={`${project}：${task.title}`}
                    style={{
                      gridColumn: `${startCol + 1} / ${endCol + 2}`, gridRow: lane + 2, zIndex: 2,
                      height: 15, lineHeight: '15px', margin: '1px 2px', padding: '0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      borderRadius: `${startsHere ? 7 : 2}px ${endsHere ? 7 : 2}px ${endsHere ? 7 : 2}px ${startsHere ? 7 : 2}px`,
                      background: color, color: '#fff', fontSize: 9, fontWeight: 600,
                      opacity: task.completed ? 0.48 : 0.92, textDecoration: task.completed ? 'line-through' : 'none', pointerEvents: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                    }}
                  >
                    {task.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {visibleProjects.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 10px', marginTop: 10 }}>
          {visibleProjects.map((project) => (
            <span key={project} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text2)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: projectColor(project, projectColors) }} />
              {project}
            </span>
          ))}
        </div>
      )}
      <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 7 }}>1タスクを開始日から終了日まで1本の帯で表示します。</p>
    </div>
  );
}

const navBtnStyle = {
  padding: '4px 8px', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text2)', fontSize: 14,
};
