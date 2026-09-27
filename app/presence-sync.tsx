'use client';

import { useEffect } from 'react';

function setStatus(online: boolean) {
  const handle = document.querySelector<HTMLElement>('.chatHandle');
  if (!handle) return;
  handle.dataset.presenceBase ??= handle.textContent || '';
  handle.textContent = `${handle.dataset.presenceBase} ${online ? '🟢 В сети' : '⚪ Не в сети'}`;
}

function setProfileStatus(online: boolean) {
  const el = document.querySelector<HTMLElement>('.profile-username');
  if (!el) return;
  el.dataset.presenceBase ??= el.textContent || '';
  el.textContent = `${el.dataset.presenceBase} · ${online ? '🟢 В сети' : '⚪ Не в сети'}`;
}

function setTyping(name: string | null) {
  const chat = document.querySelector<HTMLElement>('.chat');
  if (!chat) return;
  let el = chat.querySelector<HTMLElement>('[data-nexa-typing]');
  if (!name) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.dataset.nexaTyping = '1';
    el.style.cssText = 'color:#7d8492;font-size:12px;padding:0 0 4px 54px;min-height:18px;';
    chat.querySelector('.chatHead')?.appendChild(el);
  }
  el.textContent = `✍️ ${name} печатает…`;
}

export default function PresenceSync() {
  useEffect(() => {
    let alive = true;
    let conversation: string | null = null;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let input: HTMLInputElement | null = null;

    const originalFetch = window.fetch.bind(window);
    const trackedFetch: typeof window.fetch = async (...args) => {
      const requestUrl = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : String(args[0]);
      const match = requestUrl.match(/\/api\/messages\/([^/?]+)/);
      if (match) conversation = decodeURIComponent(match[1]);
      return originalFetch(...args);
    };
    window.fetch = trackedFetch;

    const heartbeat = () => originalFetch('/api/presence', { method: 'POST' }).catch(() => {});
    heartbeat();
    const heartbeatId = window.setInterval(heartbeat, 20000);

    const poll = async () => {
      if (!alive) return;
      try {
        if (conversation) {
          const [p,t] = await Promise.all([
            originalFetch(`/api/presence?conversation=${encodeURIComponent(conversation)}`, { cache:'no-store' }),
            originalFetch(`/api/typing/${encodeURIComponent(conversation)}`, { cache:'no-store' })
          ]);
          const presence = await p.json();
          const typing = await t.json();
          const other = (presence.presence || [])[0];
          if (other) setStatus(Boolean(other.online));
          const typer = (typing.typing || [])[0];
          setTyping(typer?.displayName || typer?.username || null);
        }
        const profileMatch = window.location.pathname.match(/^\/users\/([^/]+)/);
        if (profileMatch) {
          const r = await originalFetch(`/api/presence?username=${encodeURIComponent(profileMatch[1])}`, { cache:'no-store' });
          if (r.ok) { const d = await r.json(); if (d.presence) setProfileStatus(Boolean(d.presence.online)); }
        }
      } catch {}
    };
    const pollId = window.setInterval(poll, 1500);

    const bind = () => {
      input = document.querySelector<HTMLInputElement>('.input');
      if (!input || input.dataset.nexaPresenceBound) return;
      input.dataset.nexaPresenceBound = '1';
      input.addEventListener('input', () => {
        if (!conversation) return;
        originalFetch(`/api/typing/${encodeURIComponent(conversation)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({typing:true}) }).catch(()=>{});
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => originalFetch(`/api/typing/${encodeURIComponent(conversation!)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({typing:false}) }).catch(()=>{}), 2500);
      });
    };
    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList:true, subtree:true });
    bind();

    return () => {
      alive=false; clearInterval(heartbeatId); clearInterval(pollId); if(typingTimer)clearTimeout(typingTimer);
      observer.disconnect(); if(input)input.removeAttribute('data-nexa-presence-bound'); window.fetch = originalFetch;
    };
  }, []);

  return null;
}
