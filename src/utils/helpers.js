export const generateId = () => Math.random().toString(36).slice(2, 9);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '';

export const getTaskStart = (task) => task.startAt || '';
export const getTaskEnd = (task) => task.endAt || (task.dueDate ? `${task.dueDate}T23:59` : '');

export const isOverdue = (d) =>
  d && new Date(d) < new Date(new Date().toDateString());

export const isDueSoon = (d) => {
  if (!d) return false;
  const diff = new Date(d) - new Date(new Date().toDateString());
  return diff >= 0 && diff <= 2 * 86400000;
};

export const getTaskStatus = (task, now = new Date()) => {
  if (task.completed) return 'completed';
  const start = getTaskStart(task);
  const end = getTaskEnd(task);
  if (end && new Date(end) < now) return 'overdue';
  if (start && new Date(start) > now) return 'upcoming';
  return 'inProgress';
};

export const STATUS_META = {
  inProgress: { label: '進行中', color: 'var(--accent)', icon: 'ti-progress' },
  overdue: { label: '期限切れ', color: 'var(--danger)', icon: 'ti-alert-circle' },
  completed: { label: '完了', color: 'var(--success)', icon: 'ti-circle-check' },
  upcoming: { label: 'これから', color: '#2563EB', icon: 'ti-calendar-time' },
};

export const projectColor = (project = '未分類') => {
  const palette = ['#4A3F8F', '#2563EB', '#2E7D4F', '#B06B10', '#C13B3B', '#7C3AED', '#0F766E'];
  const hash = [...project].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const PRIORITIES = { high: '高', medium: '中', low: '低', none: 'なし' };
export const PRIORITY_ORDER = ['high', 'medium', 'low', 'none'];

export const PRIORITY_COLORS = {
  high:   { bg: '#FDF0F0', color: '#C13B3B', border: '#F5C1C1' },
  medium: { bg: '#FEF3E2', color: '#B06B10', border: '#F5D9A0' },
  low:    { bg: '#EDFAF3', color: '#2E7D4F', border: '#A8E4C0' },
  none:   { bg: '#F0EEE9', color: '#5C5850', border: '#D8D4CC' },
};

export const initialTasks = [
  {
    id: 'demo1',
    title: 'デザインレビュー',
    project: 'Webサイトリニューアル',
    priority: 'high',
    startAt: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    memo: 'Figmaのリンクを確認すること',
    notes: [
      { id: 'n1', text: 'モバイル版を確認' },
      { id: 'n2', text: 'カラーパレットのチェック' },
    ],
    checkedNoteIds: ['n1'],
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'demo2',
    title: 'ドキュメント更新',
    project: 'Webサイトリニューアル',
    priority: 'medium',
    startAt: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    completed: false,
    memo: '',
    notes: [{ id: 'n3', text: 'README.mdを更新' }],
    checkedNoteIds: [],
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'demo3',
    title: 'ユニットテスト作成',
    project: '品質改善',
    priority: 'low',
    startAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    completed: false,
    memo: '',
    notes: [],
    checkedNoteIds: [],
    createdAt: Date.now() - 100000,
  },
];
