export const generateId = () => Math.random().toString(36).slice(2, 9);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';

export const isOverdue = (d) =>
  d && new Date(d) < new Date(new Date().toDateString());

export const isDueSoon = (d) => {
  if (!d) return false;
  const diff = new Date(d) - new Date(new Date().toDateString());
  return diff >= 0 && diff <= 2 * 86400000;
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
    priority: 'high',
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
    priority: 'medium',
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
    priority: 'low',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    completed: false,
    memo: '',
    notes: [],
    checkedNoteIds: [],
    createdAt: Date.now() - 100000,
  },
];
