import React, { useState } from 'react';
import { formatMeetingDate, getMeetingStatus, MEETING_STATUS } from '../utils/meetingHelpers';
import { projectColor } from '../utils/helpers';

const dialogueKindMeta = {
  question: { label: '質問', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: 'ti-help-circle' },
  answer: { label: '回答', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: 'ti-message-check' },
  comment: { label: '発言', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: 'ti-message-circle' },
};

const dialogueKind = (kind) => dialogueKindMeta[kind] || dialogueKindMeta.comment;

export default function MeetingCard({ meeting, projectColors, onEdit, onDelete, onConvertAction }) {
  const [expanded, setExpanded] = useState(false);
  const status = getMeetingStatus(meeting);
  const statusMeta = MEETING_STATUS[status];
  const project = meeting.project || '未分類';
  const color = projectColor(project, projectColors);
  const minutesMemo = meeting.minutesMemo ?? meeting.minutes ?? '';
  const hasMinutes = Boolean(minutesMemo.trim() || meeting.dialogue?.length);
  const hasNotes = meeting.agenda || hasMinutes || meeting.decisions || meeting.actionItems?.length;
  const participantSummary = meeting.participants?.length
    ? meeting.participants.map((participant) => participant.name || '名前未入力').join('、')
    : meeting.attendees;

  return (
    <article style={{ marginBottom: 9, border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}16`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
          <i className="ti ti-users" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>{meeting.title}</strong>
            <span style={{ padding: '2px 7px', borderRadius: 99, background: statusMeta.bg, color: statusMeta.color, fontSize: 10, fontWeight: 700 }}>{statusMeta.label}</span>
            {hasMinutes && <span style={{ color: 'var(--success)', fontSize: 10, fontWeight: 700 }}><i className="ti ti-notes" /> 議事録あり</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 13px', marginTop: 5, color: 'var(--text3)', fontSize: 11 }}>
            <span><i className="ti ti-calendar-time" /> {meeting.startAt ? formatMeetingDate(meeting.startAt) : '日時未設定'}</span>
            {meeting.location && <span><i className="ti ti-map-pin" /> {meeting.location}</span>}
            {participantSummary && <span><i className="ti ti-user" /> {participantSummary}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {hasNotes && <ActionButton icon={expanded ? 'ti-chevron-up' : 'ti-chevron-down'} title="詳細" onClick={() => setExpanded((value) => !value)} />}
          <ActionButton icon="ti-edit" title="編集・議事録" onClick={() => onEdit(meeting)} />
          <ActionButton icon="ti-trash" title="削除" color="var(--danger)" onClick={() => onDelete(meeting.id)} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px 63px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
            <NoteSection icon="ti-list-check" title="議題" text={meeting.agenda} />
            <NoteSection icon="ti-notes" title="メモ" text={minutesMemo} />
            <NoteSection icon="ti-gavel" title="決定事項" text={meeting.decisions} accent />
          </div>

          {meeting.dialogue?.length > 0 && (
            <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700 }}><i className="ti ti-messages" /> 対話記録（{meeting.dialogue.length}件）</div>
              {meeting.dialogue.map((entry, index) => {
                const participant = meeting.participants?.find((item) => item.id === entry.speakerId);
                const external = (participant?.affiliation || entry.affiliation) === 'external';
                const name = participant?.name || entry.speakerName || '発言者不明';
                const company = participant?.company || entry.company;
                const department = participant?.department || entry.department;
                const kind = dialogueKind(entry.kind);
                return (
                  <div key={entry.id} style={{ padding: '8px 10px', borderTop: index === 0 ? 'none' : '1px solid var(--border)', borderLeft: `4px solid ${kind.color}`, background: kind.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ ...dialogueTagStyle, background: '#fff', color: external ? '#047857' : 'var(--accent)', borderColor: external ? '#A7F3D0' : 'var(--accent-mid)' }}><i className="ti ti-user" /> {name}</span>
                      <span style={{ ...dialogueTagStyle, background: external ? '#D1FAE5' : 'var(--accent-light)', color: external ? '#047857' : 'var(--accent)' }}>{external ? '他社' : '自社'}{company ? ` · ${company}` : ''}{department ? ` · ${department}` : ''}</span>
                      <span style={{ ...dialogueTagStyle, background: '#fff', color: kind.color, borderColor: kind.border }}><i className={`ti ${kind.icon}`} /> {kind.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {meeting.actionItems?.length > 0 && (
            <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', background: 'var(--surface2)', fontSize: 11, fontWeight: 700 }}>持ち帰り事項</div>
              {meeting.actionItems.map((item, index) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 9, padding: '8px 10px', borderTop: index === 0 ? 'none' : '1px solid var(--border)', opacity: item.converted ? 0.6 : 1 }}>
                  <span style={{ fontSize: 11, textDecoration: item.converted ? 'line-through' : 'none' }}>{item.text}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 10 }}>{item.assignee || '担当未定'}</span>
                  <span style={{ color: item.dueDate ? 'var(--text2)' : 'var(--warn)', fontSize: 10 }}>{item.dueDate || '期限未定'}</span>
                  {item.converted ? (
                    <span style={{ color: 'var(--success)', fontSize: 10, fontWeight: 700 }}>タスク化済み</span>
                  ) : (
                    <button onClick={() => onConvertAction(meeting, item)} style={{ padding: '4px 8px', border: '1px solid var(--accent-mid)', borderRadius: 5, background: 'var(--accent-light)', color: 'var(--accent)', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>タスク化</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function NoteSection({ icon, title, text, accent }) {
  return (
    <div style={{ minHeight: 90, padding: 10, borderRadius: 7, background: accent ? 'var(--success-light)' : 'var(--surface2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, color: accent ? 'var(--success)' : 'var(--text2)', fontSize: 10, fontWeight: 700 }}><i className={`ti ${icon}`} /> {title}</div>
      <p style={{ color: text ? 'var(--text2)' : 'var(--text3)', fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text || '未記入'}</p>
    </div>
  );
}

function ActionButton({ icon, title, onClick, color }) {
  return <button title={title} onClick={onClick} style={{ width: 29, height: 29, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: color || 'var(--text2)', cursor: 'pointer' }}><i className={`ti ${icon}`} /></button>;
}

const dialogueTagStyle = { display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: '100%', padding: '2px 7px', border: '1px solid transparent', borderRadius: 99, fontSize: 9, fontWeight: 800, lineHeight: 1.35 };
