'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({displayName:'',username:'',email:'',password:''});
  const [error, setError] = useState(''); const [loading,setLoading]=useState(false);
  const update=(key:string,value:string)=>setForm({...form,[key]:value});
  async function submit(e:FormEvent){e.preventDefault();setError('');setLoading(true);try{const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await res.json();if(!res.ok){setError(data.error==='USER_EXISTS'?'Такой username или email уже используется.':'Проверьте данные: username 3–24 символа, пароль минимум 8.');return;}router.push('/');router.refresh();}finally{setLoading(false)}}
  return <main className="auth-page"><div className="auth-card"><div className="auth-brand">NEXA<span>.</span></div><p className="eyebrow">JOIN NEXA</p><h1>Создать аккаунт</h1><p className="auth-subtitle">Создайте своё пространство в NEXA.</p><form onSubmit={submit}><label>Имя<input value={form.displayName} onChange={e=>update('displayName',e.target.value)} required maxLength={40} autoComplete="name" /></label><label>Username<input value={form.username} onChange={e=>update('username',e.target.value)} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" autoComplete="username" placeholder="nexa_user" /></label><label>Email<input type="email" value={form.email} onChange={e=>update('email',e.target.value)} required autoComplete="email" /></label><label>Пароль<input type="password" value={form.password} onChange={e=>update('password',e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" /></label>{error&&<p className="auth-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading?'Создаём…':'Создать аккаунт'}</button></form><p className="auth-switch">Уже есть аккаунт? <Link href="/auth/login">Войти</Link></p></div></main>;
}
