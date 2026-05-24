import React, { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import BulkMemoModal from './components/BulkMemoModal';
import Calendar from './components/Calendar';
import DayTasksModal from './components/DayTasksModal';
import { isOverdue, isDueSoon, PRIORITY_ORDER, formatDate } from './utils/helpers';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, bulkMemo, bulkComplete } = useTasks();

  const [tab, setTab] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkMemo, setShowBulkMemo] = useState(false);
  const [sortBy, setSortBy] = useState('created');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [calDay, setCalDay] = useState(null);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const overdueTasks = activeTasks.filter((t) => isOverdue(t.dueDate));

  const filteredActive = useMemo(() => {
    let list = activeTasks;
    if (filterPriority !== 'all') list = list.filter((t) => t.priority === filterPriority);
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.memo || '').toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'priority') list = [...list].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
    else if (sortBy === 'dueDate') list = [...list].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    else list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }, [tasks, filterPriority, search, sortBy]);

  const upcomingTasks = activeTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  const handleSave = (task) => {
    if (task.id && tasks.find((t) => t.id === task.id)) updateTask(task);
    else addTask(task);
    setShowModal(false); setEditTask(null);
  };

  const handleEdit = (task) => { setEditTask(task); setShowModal(true); };
  const handleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(filteredActive.map((t) => t.id));
  const clearSelect = () => setSelectedIds([]);

  const handleBulkMemo = (memo, append) => { bulkMemo(selectedIds, memo, append); setShowBulkMemo(false); clearSelect(); };
  const handleBulkComplete = () => { bulkComplete(selectedIds); clearSelect(); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* ── Main ── */}
        <div>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>タスク管理</h1>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              style={{ marginLeft: 'auto', padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3A2F7E')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              <i className="ti ti-plus" /> タスクを追加
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: '進行中', val: activeTasks.length, color: 'var(--accent)' },
              { label: '期限切れ', val: overdueTasks.length, color: 'var(--danger)' },
              { label: '完了済み', val: completedTasks.length, color: 'var(--success)' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 14 }}>
            {[['active', `進行中 (${activeTasks.length})`], ['completed', `完了 (${completedTasks.length})`]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); clearSelect(); }}
                style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === key ? 'var(--accent)' : 'var(--text3)', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -2, transition: 'color 0.15s' }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'active' && (
            <>
              {/* Controls */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
                  <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }} />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="検索…"
                    style={{ paddingLeft: 32, width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--surface)', color: 'var(--text1)', outline: 'none' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
                {[
                  ['filterPriority', filterPriority, setFilterPriority, [['all', '全優先度'], ['high', '高'], ['medium', '中'], ['low', '低'], ['none', 'なし']]],
                  ['sortBy', sortBy, setSortBy, [['created', '追加順'], ['priority', '優先度順'], ['dueDate', '期限順']]],
                ].map(([name, val, setter, opts]) => (
                  <select
                    key={name} value={val} onChange={(e) => setter(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--surface)', color: 'var(--text1)', cursor: 'pointer', outline: 'none' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  >
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}
              </div>

              {/* Bulk action bar */}
              {selectedIds.length > 0 ? (
                <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{selectedIds.length} 件選択中</span>
                  <GhostBtn icon="ti-notes" label="まとめてメモ" onClick={() => setShowBulkMemo(true)} />
                  <GhostBtn icon="ti-circle-check" label="まとめて完了" onClick={handleBulkComplete} />
                  <GhostBtn icon="ti-x" label="選択解除" onClick={clearSelect} />
                  <button onClick={selectAll} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>全選択</button>
                </div>
              ) : filteredActive.length > 0 && (
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>全選択</button>
                </div>
              )}

              {filteredActive.length === 0 ? (
                <EmptyState icon="ti-check" text={search ? '検索結果がありません' : 'タスクがありません'} />
              ) : (
                filteredActive.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onToggleComplete={toggleComplete}
                    onDelete={deleteTask}
                    isSelected={selectedIds.includes(task.id)}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </>
          )}

          {tab === 'completed' && (
            completedTasks.length === 0 ? (
              <EmptyState icon="ti-trophy" text="完了したタスクはありません" />
            ) : (
              completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTask}
                  isSelected={false}
                  onSelect={() => {}}
                />
              ))
            )
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Calendar */}
          <SideCard title="スケジュール" icon="ti-calendar">
            <Calendar tasks={tasks} onDayClick={(t, d) => setCalDay({ tasks: t, dateStr: d })} />
          </SideCard>

          {/* Upcoming */}
          <SideCard title="直近の期限" icon="ti-clock">
            {upcomingTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>期限付きタスクなし</p>
            ) : (
              upcomingTasks.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                  <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: isOverdue(t.dueDate) ? 'var(--danger)' : isDueSoon(t.dueDate) ? 'var(--warn)' : 'var(--text3)' }}>
                    {formatDate(t.dueDate)}
                  </span>
                </div>
              ))
            )}
          </SideCard>
        </div>
      </div>

      {/* Modals */}
      {showModal && <TaskModal task={editTask} onSave={handleSave} onClose={() => { setShowModal(false); setEditTask(null); }} />}
      {showBulkMemo && <BulkMemoModal count={selectedIds.length} onSave={handleBulkMemo} onClose={() => setShowBulkMemo(false)} />}
      {calDay && <DayTasksModal tasks={calDay.tasks} dateStr={calDay.dateStr} onClose={() => setCalDay(null)} />}
    </div>
  );
}

function SideCard({ title, icon, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function GhostBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 13 }} />{label}
    </button>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 44, display: 'block', marginBottom: 10 }} />
      <p style={{ fontSize: 13 }}>{text}</p>
    </div>
  );
}
