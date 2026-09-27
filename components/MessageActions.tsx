'use client';

import { useEffect, useState } from 'react';

type Props = {
  conversationId: string;
  messageId: string;
  content: string;
  isMine: boolean;
  isAdmin?: boolean;
  onReply: (messageId: string, content: string) => void;
  onChanged: () => void;
};

type Conversation = { id: string; title?: string | null; type: string; username?: string | null };

export default function MessageActions({ conversationId, messageId, content, isMine, isAdmin, onReply, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [reacting, setReacting] = useState(false);

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch(`/api/messages/${conversationId}/actions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, messageId, ...extra }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Не удалось выполнить действие');
    onChanged();
    setOpen(false);
    return d;
  };

  const edit = async () => {
    if (!value.trim()) return;
    try { await call('edit', { content: value.trim() }); setEditing(false); } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const forward = async () => {
    try {
      const r = await fetch('/api/messages', { cache: 'no-store' });
      const d = await r.json();
      const conversations: Conversation[] = d.conversations || [];
      const choices = conversations.map((c, i) => `${i + 1}. ${c.title || c.username || c.type}`).join('\n');
      const answer = prompt(`Куда переслать?\n\n${choices}\n\nВведи номер:`);
      if (!answer) return;
      const index = Number(answer) - 1;
      const target = conversations[index];
      if (!target) return alert('Неверный номер чата');
      await call('forward', { targetConversationId: target.id });
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка пересылки'); }
  };

  return <div style={{ position: 'relative', display: 'inline-flex' }}>
    <button type="button" aria-label="Действия" onClick={() => setOpen(v => !v)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>⋯</button>
    {open && <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 30, minWidth: 180, padding: 6, borderRadius: 12, background: '#171717', boxShadow: '0 8px 30px rgba(0,0,0,.35)' }}>
      <button type="button" onClick={() => { onReply(messageId, content); setOpen(false); }}>↩️ Ответить</button>
      <button type="button" onClick={async () => { try { await call('react', { reaction: '❤️' }); } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); } }}>❤️ Реакция</button>
      <button type="button" onClick={forward}>↗️ Переслать</button>
      {isAdmin && <button type="button" onClick={async () => { try { await call('pin'); } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); } }}>📌 Закрепить</button>}
      {isMine && <button type="button" onClick={() => { setValue(content); setEditing(true); setOpen(false); }}>✏️ Изменить</button>}
      {(isMine || isAdmin) && <button type="button" onClick={async () => { if (confirm('Удалить сообщение у всех?')) { try { await call('delete_for_all'); } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); } } }}>🗑️ Удалить у всех</button>}
      {!isMine && <button type="button" onClick={async () => { const reason = prompt('Причина жалобы:') || 'other'; try { await call('report', { reason }); alert('Жалоба отправлена'); } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка'); } }}>⚠️ Пожаловаться</button>}
    </div>}
    {editing && <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 40, width: 260, padding: 10, borderRadius: 12, background: '#171717' }}>
      <textarea value={value} onChange={e => setValue(e.target.value)} rows={3} style={{ width: '100%' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}><button type="button" onClick={edit}>Сохранить</button><button type="button" onClick={() => setEditing(false)}>Отмена</button></div>
    </div>}
  </div>;
}
