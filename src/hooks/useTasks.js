import { useState, useCallback } from 'react';
import { generateId, initialTasks } from '../utils/helpers';

const STORAGE_KEY = 'task-manager-tasks';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const tasks = raw ? JSON.parse(raw) : initialTasks;
    // parentId がない旧データはルートタスクとして扱い、既存データをそのまま引き継ぐ。
    return Array.isArray(tasks)
      ? tasks.map((task) => ({ ...task, parentId: task.parentId || null }))
      : initialTasks.map((task) => ({ ...task, parentId: null }));
  } catch {
    return initialTasks.map((task) => ({ ...task, parentId: null }));
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
    setTasks((prev) => {
      const deletedIds = new Set([id]);
      let foundDescendant = true;
      while (foundDescendant) {
        foundDescendant = false;
        prev.forEach((task) => {
          if (task.parentId && deletedIds.has(task.parentId) && !deletedIds.has(task.id)) {
            deletedIds.add(task.id);
            foundDescendant = true;
          }
        });
      }
      return prev.filter((task) => !deletedIds.has(task.id));
    });
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
