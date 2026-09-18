import { useCallback, useState } from 'react';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'task-manager-meetings';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (meetings) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings)); } catch {}
};

export function useMeetings() {
  const [meetings, setMeetingsRaw] = useState(load);

  const setMeetings = useCallback((updater) => {
    setMeetingsRaw((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater;
      save(next);
      return next;
    });
  }, []);

  const addMeeting = useCallback((meeting) => {
    setMeetings((previous) => [...previous, { ...meeting, id: generateId(), createdAt: Date.now() }]);
  }, [setMeetings]);

  const updateMeeting = useCallback((meeting) => {
    setMeetings((previous) => previous.map((item) => item.id === meeting.id ? meeting : item));
  }, [setMeetings]);

  const deleteMeeting = useCallback((id) => {
    setMeetings((previous) => previous.filter((item) => item.id !== id));
  }, [setMeetings]);

  return { meetings, addMeeting, updateMeeting, deleteMeeting };
}

