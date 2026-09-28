'use client';

import { useEffect, useState } from 'react';

export default function MessageModeSwitch(){
  const [mode,setMode]=useState<'voice'|'circle'>('voice');
  useEffect(()=>{
    const sync=()=>document.documentElement.dataset.nexaMessageMode=mode;
    sync();
    return()=>{delete document.documentElement.dataset.nexaMessageMode};
  },[mode]);
  return <button type="button" aria-label={mode==='voice'?'Голосовое сообщение':'Видеокружок'} title={mode==='voice'?'Голосовое сообщение':'Видеокружок'} onClick={()=>setMode(mode==='voice'?'circle':'voice')} style={{width:44,height:42,border:'1px solid rgba(255,255,255,.12)',borderRadius:12,background:'#11151f',color:'#fff',fontSize:18,cursor:'pointer',flex:'0 0 44px'}}>{mode==='voice'?'🎙️':'🔵'}</button>;
}
