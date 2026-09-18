import React, { useEffect, useRef, useState } from 'react';
import { generateId } from '../utils/helpers';

const inputStyle = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: 13, background: 'var(--surface)', color: 'var(--text1)', outline: 'none',
};

const labelStyle = { display: 'block', marginBottom: 5, color: 'var(--text3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' };

const emptyMeeting = {
  title: '', project: '', startAt: '', endAt: '', location: '', attendees: '', participants: [],
  agenda: '', minutes: '', minutesMemo: '', dialogue: [], decisions: '', actionItems: [],
};

const normalizeMeeting = (meeting) => {
  if (!meeting) return emptyMeeting;
  const legacyParticipants = !meeting.participants?.length && meeting.attendees
    ? meeting.attendees.split(/[、,]/).map((name) => name.trim()).filter(Boolean).map((name) => ({
      id: generateId(), name, affiliation: 'internal', company: '', department: '',
    }))
    : [];
  return {
    ...emptyMeeting,
    ...meeting,
    participants: meeting.participants?.length ? meeting.participants : legacyParticipants,
    minutesMemo: meeting.minutesMemo ?? meeting.minutes ?? '',
    dialogue: meeting.dialogue || [],
  };
};

const participantName = (participant) => participant?.name?.trim() || '名前未入力';

const dialogueKindMeta = {
  question: { label: '質問', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: 'ti-help-circle' },
  answer: { label: '回答', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: 'ti-message-check' },
  comment: { label: '発言', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: 'ti-message-circle' },
};

const dialogueKind = (kind) => dialogueKindMeta[kind] || dialogueKindMeta.comment;

const meetingDraftKey = (meeting) => `task-manager-meeting-draft-${meeting?.id || 'new'}`;

const loadMeetingDraft = (meeting) => {
  const initial = normalizeMeeting(meeting);
  try {
    const raw = localStorage.getItem(meetingDraftKey(meeting));
    return raw ? normalizeMeeting({ ...initial, ...JSON.parse(raw) }) : initial;
  } catch {
    return initial;
  }
};

export default function MeetingModal({ meeting, projects, onSave, onClose }) {
  const [form, setForm] = useState(() => loadMeetingDraft(meeting));
  const [minutesTab, setMinutesTab] = useState('memo');
  const [newAction, setNewAction] = useState({ text: '', assignee: '', dueDate: '' });
  const [dialogueDraft, setDialogueDraft] = useState({ speakerId: '', kind: 'comment', text: '' });
  const [editingDialogue, setEditingDialogue] = useState(null);
  const [error, setError] = useState('');
  const titleRef = useRef();

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 50); }, []);

  useEffect(() => {
    try { localStorage.setItem(meetingDraftKey(meeting), JSON.stringify(form)); } catch {}
  }, [form, meeting]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const addParticipant = () => {
    const participant = { id: generateId(), name: '', affiliation: 'internal', company: '', department: '' };
    set('participants', [...(form.participants || []), participant]);
    if (!dialogueDraft.speakerId) setDialogueDraft((previous) => ({ ...previous, speakerId: participant.id }));
  };

  const updateParticipant = (id, key, value) => set('participants', form.participants.map((participant) =>
    participant.id === id ? { ...participant, [key]: value } : participant
  ));

  const removeParticipant = (id) => {
    set('participants', form.participants.filter((participant) => participant.id !== id));
    if (dialogueDraft.speakerId === id) setDialogueDraft((previous) => ({ ...previous, speakerId: '' }));
  };

  const addDialogue = () => {
    const participant = form.participants.find((item) => item.id === dialogueDraft.speakerId);
    if (!participant || !dialogueDraft.text.trim()) return;
    set('dialogue', [...(form.dialogue || []), {
      id: generateId(),
      speakerId: participant.id,
      speakerName: participantName(participant),
      affiliation: participant.affiliation,
      company: participant.company,
      department: participant.department,
      kind: dialogueDraft.kind,
      text: dialogueDraft.text.trim(),
      createdAt: Date.now(),
    }]);
    setDialogueDraft((previous) => ({ ...previous, text: '' }));
  };

  const removeDialogue = (id) => set('dialogue', form.dialogue.filter((entry) => entry.id !== id));

  const startEditDialogue = (entry) => {
    setEditingDialogue({ id: entry.id, speakerId: entry.speakerId || '', kind: entry.kind || 'comment', text: entry.text || '' });
  };

  const cancelEditDialogue = () => setEditingDialogue(null);

  const saveDialogueEdit = () => {
    if (!editingDialogue?.text.trim()) return;
    const participant = form.participants.find((item) => item.id === editingDialogue.speakerId);
    set('dialogue', form.dialogue.map((entry) => {
      if (entry.id !== editingDialogue.id) return entry;
      return {
        ...entry,
        speakerId: participant?.id || entry.speakerId,
        speakerName: participant ? participantName(participant) : entry.speakerName,
        affiliation: participant?.affiliation || entry.affiliation,
        company: participant?.company ?? entry.company,
        department: participant?.department ?? entry.department,
        kind: editingDialogue.kind,
        text: editingDialogue.text.trim(),
        updatedAt: Date.now(),
      };
    }));
    setEditingDialogue(null);
  };

  const addActionItem = () => {
    if (!newAction.text.trim()) return;
    set('actionItems', [...(form.actionItems || []), { id: generateId(), ...newAction, text: newAction.text.trim(), converted: false }]);
    setNewAction({ text: '', assignee: '', dueDate: '' });
  };

  const removeActionItem = (id) => set('actionItems', (form.actionItems || []).filter((item) => item.id !== id));

  const handleSave = () => {
    if (!form.title.trim()) { titleRef.current?.focus(); return; }
    if (form.startAt && form.endAt && new Date(form.startAt) > new Date(form.endAt)) {
      setError('終了日時は開始日時より後にしてください。');
      return;
    }
    const savedMeeting = {
      ...form,
      title: form.title.trim(),
      project: form.project.trim() || '未分類',
      attendees: form.participants.map((participant) => participant.name?.trim()).filter(Boolean).join('、'),
      minutes: form.minutesMemo,
    };
    try { localStorage.removeItem(meetingDraftKey(meeting)); } catch {}
    onSave(savedMeeting);
  };

  return (
    <div onClick={(event) => event.target === event.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1300, padding: 16, background: 'rgba(20,18,14,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, maxHeight: '94vh', overflowY: 'auto', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17 }}>{meeting?.id ? '会議を編集・記録' : '新しい会議'}</h2>
            <p style={{ marginTop: 2, color: 'var(--text3)', fontSize: 11 }}>参加者の属性と発言の流れまで記録できます</p>
          </div>
          <button onClick={onClose} style={iconButtonStyle}><i className="ti ti-x" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
          <div>
            <label style={labelStyle}>会議名 *</label>
            <input ref={titleRef} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="例：週次進捗会議" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>案件</label>
              <input list="meeting-project-options" value={form.project} onChange={(event) => set('project', event.target.value)} placeholder="案件名を入力" style={inputStyle} />
              <datalist id="meeting-project-options">{projects.map((project) => <option key={project} value={project} />)}</datalist>
            </div>
            <div>
              <label style={labelStyle}>場所・URL</label>
              <input value={form.location} onChange={(event) => set('location', event.target.value)} placeholder="会議室 / Teams URL" style={inputStyle} />
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--surface2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>開始日時</label><input type="datetime-local" step="300" value={form.startAt} onChange={(event) => { set('startAt', event.target.value); setError(''); }} style={inputStyle} /></div>
              <div><label style={labelStyle}>終了日時</label><input type="datetime-local" step="300" min={form.startAt || undefined} value={form.endAt} onChange={(event) => { set('endAt', event.target.value); setError(''); }} style={inputStyle} /></div>
            </div>
            {error && <p style={{ marginTop: 7, color: 'var(--danger)', fontSize: 11 }}>{error}</p>}
          </div>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div><h3 style={{ fontSize: 13 }}><i className="ti ti-users" /> 参加者</h3><p style={sectionDescriptionStyle}>自社・他社、会社、部署を参加者ごとに管理</p></div>
              <button onClick={addParticipant} style={addButtonStyle}><i className="ti ti-plus" /> 参加者を追加</button>
            </div>

            {form.participants.length === 0 ? (
              <button onClick={addParticipant} style={{ width: '100%', padding: 18, border: '1px dashed var(--border2)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}><i className="ti ti-user-plus" /> 参加者を追加してください</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {form.participants.map((participant, index) => (
                  <div key={participant.id} style={{ display: 'grid', gridTemplateColumns: '26px minmax(130px,1fr) 90px minmax(120px,1fr) minmax(120px,1fr) 30px', alignItems: 'center', gap: 6, padding: 8, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: participant.affiliation === 'external' ? '#ECFDF5' : 'var(--accent-light)', color: participant.affiliation === 'external' ? '#059669' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{index + 1}</span>
                    <input value={participant.name} onChange={(event) => updateParticipant(participant.id, 'name', event.target.value)} placeholder="氏名" style={compactInputStyle} />
                    <select value={participant.affiliation || 'internal'} onChange={(event) => updateParticipant(participant.id, 'affiliation', event.target.value)} style={compactInputStyle}><option value="internal">自社</option><option value="external">他社</option></select>
                    <input value={participant.company || ''} onChange={(event) => updateParticipant(participant.id, 'company', event.target.value)} placeholder="会社名" style={compactInputStyle} />
                    <input value={participant.department || ''} onChange={(event) => updateParticipant(participant.id, 'department', event.target.value)} placeholder="部署名" style={compactInputStyle} />
                    <button onClick={() => removeParticipant(participant.id)} title="参加者を削除" style={iconButtonStyle}><i className="ti ti-trash" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <TextArea label="議題・アジェンダ" value={form.agenda} onChange={(value) => set('agenda', value)} placeholder="話し合う項目を整理…" rows={4} />

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div><h3 style={{ fontSize: 13 }}><i className="ti ti-notes" /> 議事録</h3><p style={sectionDescriptionStyle}>自由記録と発言者付き対話ログを使い分け</p></div>
              <div style={{ display: 'flex', padding: 3, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface2)' }}>
                <TabButton active={minutesTab === 'memo'} onClick={() => setMinutesTab('memo')} icon="ti-note">メモ</TabButton>
                <TabButton active={minutesTab === 'dialogue'} onClick={() => setMinutesTab('dialogue')} icon="ti-messages">対話 ({form.dialogue.length})</TabButton>
              </div>
            </div>

            {minutesTab === 'memo' ? (
              <textarea value={form.minutesMemo || ''} onChange={(event) => set('minutesMemo', event.target.value)} placeholder="会議で話した内容、背景、検討事項などを自由に記録…" rows={10} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, minHeight: 190 }} />
            ) : (
              <div>
                {form.participants.length === 0 ? (
                  <p style={{ padding: 16, borderRadius: 7, background: '#FFFBEB', color: 'var(--warn)', fontSize: 11 }}><i className="ti ti-alert-triangle" /> 対話を記録するには、先に参加者を追加してください。</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 90px 1fr auto', gap: 6, alignItems: 'start', marginBottom: 12 }}>
                    <select value={dialogueDraft.speakerId} onChange={(event) => setDialogueDraft((previous) => ({ ...previous, speakerId: event.target.value }))} style={inputStyle}>
                      <option value="">発言者を選択</option>
                      {form.participants.map((participant) => <option key={participant.id} value={participant.id}>{participantName(participant)}（{participant.affiliation === 'external' ? '他社' : '自社'}）</option>)}
                    </select>
                    <select value={dialogueDraft.kind} onChange={(event) => setDialogueDraft((previous) => ({ ...previous, kind: event.target.value }))} style={inputStyle}><option value="question">質問</option><option value="answer">回答</option><option value="comment">発言</option></select>
                    <textarea value={dialogueDraft.text} onChange={(event) => setDialogueDraft((previous) => ({ ...previous, text: event.target.value }))} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') addDialogue(); }} placeholder="発言内容を入力（Ctrl＋Enterで追加）" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                    <button onClick={addDialogue} disabled={!dialogueDraft.speakerId || !dialogueDraft.text.trim()} style={{ ...addButtonStyle, height: 38, opacity: !dialogueDraft.speakerId || !dialogueDraft.text.trim() ? 0.45 : 1 }}><i className="ti ti-plus" /> 追加</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.dialogue.length === 0 ? (
                    <p style={{ padding: 20, border: '1px dashed var(--border2)', borderRadius: 8, color: 'var(--text3)', textAlign: 'center', fontSize: 11 }}>対話記録はまだありません</p>
                  ) : form.dialogue.map((entry) => {
                    const currentParticipant = form.participants.find((participant) => participant.id === entry.speakerId);
                    const external = (currentParticipant?.affiliation || entry.affiliation) === 'external';
                    const name = currentParticipant ? participantName(currentParticipant) : entry.speakerName;
                    const company = currentParticipant?.company || entry.company;
                    const department = currentParticipant?.department || entry.department;
                    const kind = dialogueKind(entry.kind);
                    const isEditing = editingDialogue?.id === entry.id;
                    return (
                      <div key={entry.id} style={{ padding: 9, border: `1px solid ${kind.border}`, borderLeft: `4px solid ${kind.color}`, borderRadius: 8, background: kind.bg }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: isEditing ? 8 : 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
                            <span style={{ ...dialogueTagStyle, background: '#fff', color: external ? '#047857' : 'var(--accent)', borderColor: external ? '#A7F3D0' : 'var(--accent-mid)' }}><i className="ti ti-user" /> {name}</span>
                            <span style={{ ...dialogueTagStyle, background: external ? '#D1FAE5' : 'var(--accent-light)', color: external ? '#047857' : 'var(--accent)' }}>{external ? '他社' : '自社'}{company ? ` · ${company}` : ''}{department ? ` · ${department}` : ''}</span>
                            <span style={{ ...dialogueTagStyle, background: '#fff', color: kind.color, borderColor: kind.border }}><i className={`ti ${kind.icon}`} /> {kind.label}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {isEditing ? (
                              <>
                                <button onClick={saveDialogueEdit} disabled={!editingDialogue.text.trim()} title="変更を保存" style={{ ...iconButtonStyle, color: kind.color, opacity: editingDialogue.text.trim() ? 1 : 0.4 }}><i className="ti ti-check" /></button>
                                <button onClick={cancelEditDialogue} title="編集をキャンセル" style={iconButtonStyle}><i className="ti ti-arrow-back-up" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditDialogue(entry)} title="対話を編集" style={iconButtonStyle}><i className="ti ti-pencil" /></button>
                                <button onClick={() => removeDialogue(entry.id)} title="対話を削除" style={iconButtonStyle}><i className="ti ti-x" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '180px 90px 1fr', gap: 6, alignItems: 'start' }}>
                            <select value={editingDialogue.speakerId} onChange={(event) => setEditingDialogue((previous) => ({ ...previous, speakerId: event.target.value }))} style={compactInputStyle}>
                              {form.participants.map((participant) => <option key={participant.id} value={participant.id}>{participantName(participant)}（{participant.affiliation === 'external' ? '他社' : '自社'}）</option>)}
                            </select>
                            <select value={editingDialogue.kind} onChange={(event) => setEditingDialogue((previous) => ({ ...previous, kind: event.target.value }))} style={compactInputStyle}><option value="question">質問</option><option value="answer">回答</option><option value="comment">発言</option></select>
                            <textarea value={editingDialogue.text} onChange={(event) => setEditingDialogue((previous) => ({ ...previous, text: event.target.value }))} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') saveDialogueEdit(); }} rows={2} style={{ ...compactInputStyle, resize: 'vertical', lineHeight: 1.45 }} />
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: 'var(--text1)', fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <TextArea label="決定事項" value={form.decisions} onChange={(value) => set('decisions', value)} placeholder="会議で決まったことを記録…" rows={3} />

          <section>
            <label style={labelStyle}>持ち帰り事項・アクション</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 120px 140px auto', gap: 6, marginBottom: 8 }}>
              <input value={newAction.text} onChange={(event) => setNewAction((previous) => ({ ...previous, text: event.target.value }))} onKeyDown={(event) => event.key === 'Enter' && addActionItem()} placeholder="対応内容" style={inputStyle} />
              <input value={newAction.assignee} onChange={(event) => setNewAction((previous) => ({ ...previous, assignee: event.target.value }))} placeholder="担当者" style={inputStyle} />
              <input type="date" value={newAction.dueDate} onChange={(event) => setNewAction((previous) => ({ ...previous, dueDate: event.target.value }))} style={inputStyle} />
              <button onClick={addActionItem} style={{ padding: '7px 12px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}><i className="ti ti-plus" /></button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
              {(form.actionItems || []).length === 0 ? <p style={{ padding: 12, color: 'var(--text3)', textAlign: 'center', fontSize: 11 }}>持ち帰り事項はありません</p> : form.actionItems.map((item, index) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 8, padding: '8px 11px', borderBottom: index < form.actionItems.length - 1 ? '1px solid var(--border)' : 'none', background: item.converted ? 'var(--success-light)' : 'transparent' }}>
                  <span style={{ fontSize: 12, textDecoration: item.converted ? 'line-through' : 'none' }}>{item.text}</span><span style={{ color: 'var(--text3)', fontSize: 10 }}>{item.assignee || '担当未定'}</span><span style={{ color: 'var(--text3)', fontSize: 10 }}>{item.dueDate || '期限未定'}</span><button onClick={() => removeActionItem(item.id)} style={iconButtonStyle}><i className="ti ti-trash" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 22 }}><button onClick={onClose} style={secondaryButtonStyle}>キャンセル</button><button onClick={handleSave} style={primaryButtonStyle}>保存する</button></div>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 5 }) {
  return <div><label style={labelStyle}>{label}</label><textarea value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /></div>;
}

function TabButton({ active, onClick, icon, children }) {
  return <button onClick={onClick} style={{ padding: '6px 11px', border: 'none', borderRadius: 5, background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text3)', boxShadow: active ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}><i className={`ti ${icon}`} /> {children}</button>;
}

const sectionStyle = { padding: 14, border: '1px solid var(--border)', borderRadius: 9, background: '#FCFCFB' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 11 };
const sectionDescriptionStyle = { marginTop: 2, color: 'var(--text3)', fontSize: 9 };
const compactInputStyle = { ...inputStyle, padding: '7px 8px', fontSize: 11 };
const dialogueTagStyle = { display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: '100%', padding: '2px 7px', border: '1px solid transparent', borderRadius: 99, fontSize: 9, fontWeight: 800, lineHeight: 1.35 };
const iconButtonStyle = { padding: 5, border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 15 };
const addButtonStyle = { padding: '7px 11px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 };
const secondaryButtonStyle = { padding: '8px 17px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer' };
const primaryButtonStyle = { padding: '8px 22px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
