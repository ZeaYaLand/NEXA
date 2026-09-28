'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Track={id:string;username:string;title:string;description:string;media_url:string;like_count:number;liked:boolean;created_at:string};

export default function HomeMusic(){
 const [tracks,setTracks]=useState<Track[]>([]);
 const [current,setCurrent]=useState<Track|null>(null);
 const [playing,setPlaying]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/media-library?kind=music',{cache:'no-store'}).then(r=>r.json()).then(d=>setTracks((d.items||[]).filter((x:Track)=>x.media_url).slice(0,8))).catch(()=>{}).finally(()=>setLoading(false))},[]);
 useEffect(()=>{if(!current||!audio.current)return;audio.current.src=current.media_url;if(playing)audio.current.play().catch(()=>setPlaying(false));},[current]);
 const toggle=(track:Track)=>{if(current?.id!==track.id){setCurrent(track);setPlaying(true);return} if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else{audio.current.play().then(()=>setPlaying(true)).catch(()=>{})}};
 if(loading||!tracks.length)return <section className="homeMusic"><div className="homeMusicHead"><div><span>МУЗЫКА</span><h2>Музыка</h2></div><Link href="/media?tab=music">Вся музыка →</Link></div>{!loading&&<div className="homeMusicEmpty">Добавь первый трек — он появится здесь.</div>}</section>;
 return <section className="homeMusic"><div className="homeMusicHead"><div><span>МУЗЫКА NEXA</span><h2>Музыка</h2></div><Link href="/media?tab=music">Вся музыка →</Link></div><div className="homeMusicTabs"><button className="active">Треки</button><span>Рекомендации</span><span>Недавние</span></div><div className="homeTrackList">{tracks.map((t,i)=><button key={t.id} className={`homeTrack ${current?.id===t.id?'current':''}`} onClick={()=>toggle(t)}><span className="trackNum">{current?.id===t.id&&playing?'❚❚':i+1}</span><span className="trackCover">♫</span><span className="trackInfo"><b>{t.title}</b><small>{t.username}{t.description?` · ${t.description}`:''}</small></span><span className="trackLike">♥ {t.like_count}</span><span className="trackPlay">{current?.id===t.id&&playing?'❚❚':'▶'}</span></button>)}</div>{current&&<div className="homeMiniPlayer"><button onClick={()=>toggle(current)}>{playing?'❚❚':'▶'}</button><div><b>{current.title}</b><span>{current.username}</span></div><input type="range" min="0" max="100" defaultValue="100" onChange={e=>{if(audio.current)audio.current.volume=Number(e.target.value)/100}} aria-label="Громкость"/><Link href={`/media?tab=music&track=${encodeURIComponent(current.id)}`}>♫</Link><audio ref={audio} onEnded={()=>setPlaying(false)} /></div>}</section>;
}
