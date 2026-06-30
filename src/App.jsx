import React, { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import BulkMemoModal from './components/BulkMemoModal';
import Calendar from './components/Calendar';
import DayTasksModal from './components/DayTasksModal';
import { formatDateTime, getTaskEnd, getTaskStatus, STATUS_META, PRIORITY_ORDER, projectColor } from './utils/helpers';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask, toggleComplete, bulkMemo, bulkComplete } = useTasks();

  const [tab, setTab] = useState('inProgress');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkMemo, setShowBulkMemo] = useState(false);
  const [sortBy, setSortBy] = useState('created');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [search, setSearch] = useState('');
  const [calDay, setCalDay] = useState(null);

  const statusTasks = useMemo(() => ({
    inProgress: tasks.filter((task) => getTaskStatus(task) === 'inProgress'),
    overdue: tasks.filter((task) => getTaskStatus(task) === 'overdue'),
    completed: tasks.filter((task) => getTaskStatus(task) === 'completed'),
    upcoming: tasks.filter((task) => getTaskStatus(task) === 'upcoming'),
  }), [tasks]);

  const projects = useMemo(() => [...new Set(tasks.map((task) => task.project || '未分類'))].sort(), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = statusTasks[tab] || [];
    if (filterPriority !== 'all') list = list.filter((t) => t.priority === filterPriority);
    if (filterProject !== 'all') list = list.filter((t) => (t.project || '未分類') === filterProject);
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.memo || '').toLowerCase().includes(search.toLowerCase()) || (t.project || '未分類').toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'priority') list = [...list].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
    else if (sortBy === 'schedule') list = [...list].sort((a, b) => {
      const aDate = a.startAt || getTaskEnd(a);
      const bDate = b.startAt || getTaskEnd(b);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1; if (!bDate) return -1;
      return new Date(aDate) - new Date(bDate);
    });
    else list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }, [statusTasks, tab, filterPriority, filterProject, search, sortBy]);

  const groupedTasks = useMemo(() => filteredTasks.reduce((groups, task) => {
    const project = task.project || '未分類';
    if (!groups[project]) groups[project] = [];
    groups[project].push(task);
    return groups;
  }, {}), [filteredTasks]);

  const upcomingTasks = tasks
    .filter((t) => !t.completed && getTaskEnd(t))
    .sort((a, b) => new Date(getTaskEnd(a)) - new Date(getTaskEnd(b)))
    .slice(0, 6);

  const handleSave = (task) => {
    if (task.id && tasks.find((t) => t.id === task.id)) updateTask(task);
    else addTask(task);
    setShowModal(false); setEditTask(null);
  };

  const handleEdit = (task) => { setEditTask(task); setShowModal(true); };
  const handleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(filteredTasks.map((t) => t.id));
  const clearSelect = () => setSelectedIds([]);

  const handleBulkMemo = (memo, append) => { bulkMemo(selectedIds, memo, append); setShowBulkMemo(false); clearSelect(); };
  const handleBulkComplete = () => { bulkComplete(selectedIds); clearSelect(); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="app-layout">

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
          <div className="stats-grid">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <button key={key} onClick={() => { setTab(key); clearSelect(); }} style={{ textAlign: 'left', background: tab === key ? 'var(--accent-light)' : 'var(--surface)', border: `1px solid ${tab === key ? 'var(--accent-mid)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '12px 16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}><i className={`ti ${meta.icon}`} />{meta.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: meta.color, marginTop: 4 }}>{statusTasks[key].length}</div>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 14, overflowX: 'auto' }}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => { setTab(key); clearSelect(); }}
                style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === key ? 'var(--accent)' : 'var(--text3)', borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -2, transition: 'color 0.15s' }}
              >
                {meta.label} ({statusTasks[key].length})
              </button>
            ))}
          </div>

          <>
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
                  ['filterProject', filterProject, setFilterProject, [['all', '全案件'], ...projects.map((project) => [project, project])]],
                  ['sortBy', sortBy, setSortBy, [['created', '追加順'], ['priority', '優先度順'], ['schedule', '日程順']]],
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
              {tab !== 'completed' && (selectedIds.length > 0 ? (
                <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-mid)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{selectedIds.length} 件選択中</span>
                  <GhostBtn icon="ti-notes" label="まとめてメモ" onClick={() => setShowBulkMemo(true)} />
                  <GhostBtn icon="ti-circle-check" label="まとめて完了" onClick={handleBulkComplete} />
                  <GhostBtn icon="ti-x" label="選択解除" onClick={clearSelect} />
                  <button onClick={selectAll} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>全選択</button>
                </div>
              ) : filteredTasks.length > 0 && (
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>全選択</button>
                </div>
              ))}

              {filteredTasks.length === 0 ? (
                <EmptyState icon="ti-check" text={search ? '検索結果がありません' : 'タスクがありません'} />
              ) : (
                Object.entries(groupedTasks).map(([project, projectTasks]) => (
                  <section key={project} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 2px 8px' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: projectColor(project) }} />
                      <h2 style={{ fontSize: 14, fontWeight: 700 }}>{project}</h2>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{projectTasks.length}件</span>
                    </div>
                    {projectTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEdit}
                        onToggleComplete={toggleComplete}
                        onDelete={deleteTask}
                        isSelected={selectedIds.includes(task.id)}
                        selectable={tab !== 'completed'}
                        onSelect={tab === 'completed' ? () => {} : handleSelect}
                      />
                    ))}
                  </section>
                ))
              )}
          </>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Calendar */}
          <SideCard title="スケジュール" icon="ti-calendar">
            <Calendar tasks={tasks} onDayClick={(t, d) => setCalDay({ tasks: t, dateStr: d })} />
          </SideCard>

          {/* Upcoming */}
          <SideCard title="直近の終了予定" icon="ti-clock">
            {upcomingTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>期限付きタスクなし</p>
            ) : (
              upcomingTasks.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 10, color: projectColor(t.project || '未分類'), fontWeight: 700 }}>{t.project || '未分類'}</span>
                    <span style={{ display: 'block', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  </div>
                  <span style={{ fontSize: 10, whiteSpace: 'nowrap', color: getTaskStatus(t) === 'overdue' ? 'var(--danger)' : 'var(--text3)' }}>
                    {formatDateTime(getTaskEnd(t))}
                  </span>
                </div>
              ))
            )}
          </SideCard>
        </div>
      </div>

      {/* Modals */}
      {showModal && <TaskModal task={editTask} projects={projects} onSave={handleSave} onClose={() => { setShowModal(false); setEditTask(null); }} />}
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
