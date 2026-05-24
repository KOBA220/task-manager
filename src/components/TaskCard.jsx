import React from 'react';
import { formatDate, isOverdue, isDueSoon, PRIORITIES, PRIORITY_COLORS } from '../utils/helpers';

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    marginBottom: 8,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    cursor: 'default',
    position: 'relative',
  },
};

export default function TaskCard({ task, onEdit, onToggleComplete, onDelete, isSelected, onSelect }) {
  const overdue = !task.completed && isOverdue(task.dueDate);
  const soon = !task.completed && !overdue && isDueSoon(task.dueDate);
  const pc = PRIORITY_COLORS[task.priority];
  const notesDone = (task.notes || []).filter((n) => (task.checkedNoteIds || []).includes(n.id)).length;

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: overdue ? '3px solid var(--danger)' : soon ? '3px solid var(--warn)' : undefined,
        opacity: task.completed ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(task.id)}
        style={{ marginTop: 2, width: 15, minWidth: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 600, fontSize: 14,
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'var(--text3)' : 'var(--text1)',
          }}>
            {task.title}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
          }}>
            {PRIORITIES[task.priority]}
          </span>
          {task.dueDate && (
            <span style={{
              fontSize: 11,
              color: overdue ? 'var(--danger)' : soon ? 'var(--warn)' : 'var(--text3)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <i className="ti ti-calendar" style={{ fontSize: 12 }} />
              {formatDate(task.dueDate)}
              {overdue && ' · 期限切れ'}
              {soon && ' · もうすぐ'}
            </span>
          )}
        </div>

        {task.memo && (
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
            {task.memo.length > 100 ? task.memo.slice(0, 100) + '…' : task.memo}
          </p>
        )}

        {task.notes?.length > 0 && (
          <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-checklist" style={{ fontSize: 13 }} />
            {notesDone}/{task.notes.length} 完了
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <ActionBtn title="編集" icon="ti-edit" onClick={() => onEdit(task)} />
        <ActionBtn
          title={task.completed ? '未完了に戻す' : '完了にする'}
          icon={task.completed ? 'ti-refresh' : 'ti-circle-check'}
          onClick={() => onToggleComplete(task.id)}
          color={task.completed ? 'var(--success)' : undefined}
        />
        <ActionBtn title="削除" icon="ti-trash" onClick={() => onDelete(task.id)} color="var(--danger)" />
      </div>
    </div>
  );
}

function ActionBtn({ title, icon, onClick, color }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '5px 7px', borderRadius: 'var(--radius-sm)',
        background: 'none', border: '1px solid var(--border)',
        color: color || 'var(--text2)', cursor: 'pointer', fontSize: 13,
        transition: 'background 0.1s, color 0.1s',
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      <i className={`ti ${icon}`} />
    </button>
  );
}
