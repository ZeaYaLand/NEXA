'use client';

import { useEffect } from 'react';

function setStatus(text: string, online: boolean) {
  const handle = document.querySelector<HTMLElement>('.chatHandle');
  if (!handle) return;
  handle.dataset.presenceBase ??= handle.textContent || '';
  handle.textContent = `${handle.dataset.presenceBase} ${online ? '🟢 В сети' : '⚪ Не в сети'}`;
}

function setTyping(name: string | null) {
  const chat = document.querySelector<HTMLElement>('.chat');
  if (!chat) return;
  let el = chat.querySelector<HTMLElement>('[data-nexa-typing]');
  if (!name) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.dataset.nexaTyping = '1';
    el.className = 'nexa-typing';
    const head = chat.querySelector('.chatHead');
    head?.appendChild(el);
  }
  el.textContent = `✍️ ${name} печатает…`;
}

export default function PresenceSync() {
  useEffect(() => {
    let alive = true;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let input: HTMLInputElement | null = null;
    let conversation = new URLSearchParams(window.location.search).get('conversation');

    const heartbeat = () => fetch('/api/presence', { method: 'POST' }).catch(() => {});
    heartbeat();
    const heartbeatId = window.setInterval(heartbeat, 20000);

    const poll = async () => {
      if (!alive) return;
      conversation = new URLSearchParams(window.location.search).get('conversation');
      if (!conversation) return;
      try {
        const [p,t] = await Promise.all([
          fetch(`/api/presence?conversation=${encodeURIComponent(conversation)}`, { cache:'no-store' }),
          fetch(`/api/typing/${encodeURIComponent(conversation)}`, { cache:'no-store' })
        ]);
        const presence = await p.json();
        const typing = await t.json();
        const other = (presence.presence || [])[0];
        if (other) setStatus('', Boolean(other.online));
        const typer = (typing.typing || [])[0];
        setTyping(typer?.displayName || typer?.username || null);
      } catch {}
    };
    const pollId = window.setInterval(poll, 1500);

    const bind = () => {
      input = document.querySelector<HTMLInputElement>('.input');
      if (!input || input.dataset.nexaPresenceBound) return;
      input.dataset.nexaPresenceBound = '1';
      input.addEventListener('input', () => {
        const id = new URLSearchParams(window.location.search).get('conversation');
        if (!id) return;
        fetch(`/api/typing/${encodeURIComponent(id)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({typing:true}) }).catch(()=>{});
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => fetch(`/api/typing/${encodeURIComponent(id)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({typing:false}) }).catch(()=>{}), 2500);
      });
    };
    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList:true, subtree:true });
    bind();

    return () => { alive=false; clearInterval(heartbeatId); clearInterval(pollId); if(typingTimer)clearTimeout(typingTimer); observer.disconnect(); if(input)input.removeAttribute('data-nexa-presence-bound'); };
  }, []);

  return null;
}
