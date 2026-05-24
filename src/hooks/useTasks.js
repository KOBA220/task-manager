import { useState, useCallback } from 'react';
import { generateId, initialTasks } from '../utils/helpers';

const STORAGE_KEY = 'task-manager-tasks';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialTasks;
  } catch {
    return initialTasks;
  }
};

const save = (tasks) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
};

export function useTasks() {
  const [tasks, setTasksRaw] = useState(load);

  const setTasks = useCallback((updater) => {
    setTasksRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      save(next);
      return next;
    });
  }, []);

  const addTask = useCallback((task) => {
    setTasks((prev) => [...prev, { ...task, id: generateId(), createdAt: Date.now() }]);
  }, [setTasks]);

  const updateTask = useCallback((task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }, [setTasks]);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  const toggleComplete = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, [setTasks]);

  const bulkMemo = useCallback((ids, memo, append) => {
    setTasks((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, memo: append ? (t.memo ? t.memo + '\n' + memo : memo) : memo }
          : t
      )
    );
  }, [setTasks]);

  const bulkComplete = useCallback((ids) => {
    setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, completed: true } : t)));
  }, [setTasks]);

  return { tasks, addTask, updateTask, deleteTask, toggleComplete, bulkMemo, bulkComplete };
}
