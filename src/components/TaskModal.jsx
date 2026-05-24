import React, { useState, useEffect, useRef } from 'react';
import { generateId, PRIORITIES, PRIORITY_ORDER } from '../utils/helpers';

const inputStyle = {
  width: '100%', padding: '8px 11px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: 14, background: 'var(--surface)',
  color: 'var(--text1)', outline: 'none', transition: 'border-color 0.15s',
};
const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

export default function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(() => task || {
    title: '', priority: 'none', dueDate: '', memo: '', notes: [], checkedNoteIds: [],
  });
  const [newNote, setNewNote] = useState('');
  const titleRef = useRef();

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 50); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addNote = () => {
    if (!newNote.trim()) return;
    set('notes', [...(form.notes || []), { id: generateId(), text: newNote.trim() }]);
    setNewNote('');
  };

  const removeNote = (id) => set('notes', form.notes.filter((n) => n.id !== id));

  const toggleCheck = (id) => {
    const checked = form.checkedNoteIds || [];
    set('checkedNoteIds', checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id]);
  };

  const handleSave = () => {
    if (!form.title.trim()) { titleRef.current?.focus(); return; }
    onSave({ ...form, id: form.id || generateId(), completed: form.completed || false });
  };

  const handleKey = (e) => { if (e.key === 'Escape') onClose(); };

  return (
    <div
      onKeyDown={handleKey}
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
        padding: '24px', width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeSlide 0.18s ease',
      }}>
        <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{task?.id ? 'タスクを編集' : '新しいタスク'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>タスク名</label>
            <input
              ref={titleRef}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="タスクを入力…"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Priority + DueDate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>優先度</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              >
                {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{PRIORITIES[p]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>期限</label>
              <input
                type="date"
                value={form.dueDate || ''}
                onChange={(e) => set('dueDate', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label style={labelStyle}>メモ</label>
            <textarea
              value={form.memo || ''}
              onChange={(e) => set('memo', e.target.value)}
              rows={3}
              placeholder="自由にメモを書けます…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Checklist */}
          <div>
            <label style={labelStyle}>チェックリスト</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
                placeholder="項目を入力してEnter…"
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={addNote}
                style={{ padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 18, flexShrink: 0 }}
              >
                <i className="ti ti-plus" />
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(form.notes || []).length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>項目がありません</div>
              ) : (
                (form.notes || []).map((note, i) => {
                  const checked = (form.checkedNoteIds || []).includes(note.id);
                  return (
                    <div
                      key={note.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 14px',
                        borderBottom: i < form.notes.length - 1 ? '1px solid var(--border)' : 'none',
                        background: checked ? 'var(--surface2)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(note.id)}
                        style={{ width: 15, minWidth: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1, fontSize: 13, textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--text3)' : 'var(--text1)' }}>
                        {note.text}
                      </span>
                      <button
                        onClick={() => removeNote(note.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '2px 4px', lineHeight: 1 }}
                      >
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 22px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3A2F7E')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
