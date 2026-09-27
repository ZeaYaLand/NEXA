'use client';

import { useEffect } from 'react';

const qs = <T extends Element>(selector: string) => document.querySelector<T>(selector);

function setStatus(online: boolean) {
  const handle = qs<HTMLElement>('[class*="chatHandle"]');
  if (!handle) return;
  handle.dataset.presenceBase ??= handle.textContent || '';
  handle.textContent = `${handle.dataset.presenceBase} · ${online ? '🟢 В сети' : '⚪ Не в сети'}`;
}

function setProfileStatus(online: boolean) {
  const el = qs<HTMLElement>('[class*="profile-username"]');
  if (!el) return;
  el.dataset.presenceBase ??= el.textContent || '';
  el.textContent = `${el.dataset.presenceBase} · ${online ? '🟢 В сети' : '⚪ Не в сети'}`;
}

function setTyping(name: string | null) {
  const chat = qs<HTMLElement>('[class*="chat"]');
  const head = qs<HTMLElement>('[class*="chatHead"]');
  if (!chat || !head) return;
  let el = chat.querySelector<HTMLElement>('[data-nexa-typing]');
  if (!name) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.dataset.nexaTyping = '1';
    el.style.cssText = 'color:#7d8492;font-size:12px;padding:4px 0 6px 54px;min-height:18px;';
    head.appendChild(el);
  }
  el.textContent = `✍️ ${name} печатает…`;
}

export default function PresenceSync() {
  useEffect(() => {
    let alive = true;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let boundInput: HTMLInputElement | null = null;
    let boundConversation: string | null = null;

    const getConversation = () => new URLSearchParams(window.location.search).get('conversation');
    const originalFetch = window.fetch.bind(window);

    const heartbeat = () => originalFetch('/api/presence', { method: 'POST' }).catch(() => {});
    heartbeat();
    const heartbeatId = window.setInterval(heartbeat, 15000);

    const poll = async () => {
      if (!alive) return;
      const conversation = getConversation();
      if (conversation !== boundConversation) {
        boundConversation = conversation;
        if (!conversation) setTyping(null);
      }
      try {
        if (conversation) {
          const [p, t] = await Promise.all([
            originalFetch(`/api/presence?conversation=${encodeURIComponent(conversation)}`, { cache: 'no-store' }),
            originalFetch(`/api/typing/${encodeURIComponent(conversation)}`, { cache: 'no-store' })
          ]);
          if (p.ok) {
            const presence = await p.json();
            const other = (presence.presence || [])[0];
            if (other) setStatus(Boolean(other.online));
          }
          if (t.ok) {
            const typing = await t.json();
            const typer = (typing.typing || [])[0];
            setTyping(typer?.displayName || typer?.username || null);
          }
        }

        const profileMatch = window.location.pathname.match(/^\/users\/([^/]+)/);
        if (profileMatch) {
          const r = await originalFetch(`/api/presence?username=${encodeURIComponent(profileMatch[1])}`, { cache: 'no-store' });
          if (r.ok) {
            const d = await r.json();
            if (d.presence) setProfileStatus(Boolean(d.presence.online));
          }
        }
      } catch {}
    };

    const sendTyping = (typing: boolean) => {
      const conversation = getConversation();
      if (!conversation) return;
      originalFetch(`/api/typing/${encodeURIComponent(conversation)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typing })
      }).catch(() => {});
    };

    const bind = () => {
      const input = qs<HTMLInputElement>('[class*="input"]');
      if (!input || input.dataset.nexaPresenceBound === '1') return;
      input.dataset.nexaPresenceBound = '1';
      boundInput = input;
      input.addEventListener('input', () => {
        sendTyping(true);
        if (typingTimer) clearTimeout(typingTimer);
        typingTimer = setTimeout(() => sendTyping(false), 3000);
      });
      input.addEventListener('blur', () => sendTyping(false));
    };

    bind();
    poll();
    const pollId = window.setInterval(poll, 1000);
    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      alive = false;
      clearInterval(heartbeatId);
      clearInterval(pollId);
      if (typingTimer) clearTimeout(typingTimer);
      if (boundInput) boundInput.removeAttribute('data-nexa-presence-bound');
      observer.disconnect();
      if (boundConversation) sendTyping(false);
    };
  }, []);

  return null;
}
