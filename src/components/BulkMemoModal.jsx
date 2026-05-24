import React, { useState } from 'react';

export default function BulkMemoModal({ count, onSave, onClose }) {
  const [memo, setMemo] = useState('');
  const [append, setAppend] = useState(false);

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
        padding: 24, width: '100%', maxWidth: 420,
        animation: 'fadeSlide 0.18s ease',
      }}>
        <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>まとめてメモ</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}>
          <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
          <strong>{count}</strong> 件のタスクに同じメモを適用します
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={append}
            onChange={(e) => setAppend(e.target.checked)}
            style={{ width: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          既存のメモに追記する（上書きしない）
        </label>

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={4}
          placeholder="ここに書いたメモが選択した全タスクに適用されます…"
          autoFocus
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--surface)',
            color: 'var(--text1)', outline: 'none', resize: 'vertical', lineHeight: 1.6,
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13 }}>
            キャンセル
          </button>
          <button
            onClick={() => onSave(memo, append)}
            style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
}
