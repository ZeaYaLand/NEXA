'use client';

import { useEffect, useState } from 'react';

export default function MessageModeSwitch(){
  const [mode,setMode]=useState<'voice'|'circle'>('voice');
  useEffect(()=>{
    if(typeof window==='undefined')return;
    const install=()=>{
      if(!location.pathname.startsWith('/messages'))return;
      const row=document.querySelector<HTMLElement>('.composerRow');
      const send=row?.querySelector<HTMLButtonElement>('button[class*="send"]');
      if(!row||!send||row.querySelector('[data-nexa-mode-switch]'))return;
      const button=document.createElement('button');
      button.type='button';button.dataset.nexaModeSwitch='true';
      Object.assign(button.style,{width:'44px',height:'42px',flex:'0 0 44px',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',background:'#11151f',color:'#fff',fontSize:'18px',cursor:'pointer',touchAction:'manipulation'});
      const paint=()=>{button.textContent=mode==='voice'?'🎙️':'🔵';button.title=mode==='voice'?'Голосовое сообщение — нажми для видеокружка':'Видеокружок — нажми для голосового'};
      button.addEventListener('click',()=>{setMode(m=>m==='voice'?'circle':'voice')});
      paint();row.insertBefore(button,send);
      return()=>button.remove();
    };
    const observer=new MutationObserver(install);observer.observe(document.body,{childList:true,subtree:true});
    const cleanup=install();
    return()=>{observer.disconnect();cleanup?.()};
  },[mode]);
  return null;
}
