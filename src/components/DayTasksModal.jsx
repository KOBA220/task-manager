import React from 'react';
import { PRIORITIES, PRIORITY_COLORS } from '../utils/helpers';

export default function DayTasksModal({ tasks, dateStr, onClose }) {
  const label = new Date(dateStr).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
        padding: 22, width: '100%', maxWidth: 360,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{label} のタスク</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
            <i className="ti ti-x" />
          </button>
        </div>
        {tasks.map((t) => {
          const pc = PRIORITY_COLORS[t.priority];
          return (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
              <span style={{ fontSize: 13 }}>{t.title}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, whiteSpace: 'nowrap' }}>
                {PRIORITIES[t.priority]}
              </span>
            </div>
          );
        })}
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', padding: '9px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
          閉じる
        </button>
      </div>
    </div>
  );
}
