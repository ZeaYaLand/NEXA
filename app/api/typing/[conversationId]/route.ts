import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params={params:Promise<{conversationId:string}>};

export async function POST(req:NextRequest,{params}:Params){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {conversationId}=await params;
  const member=await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND status=\'active\'',[conversationId,user.id]);
  if(!member.rowCount)return NextResponse.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>({}));
  if(body.typing){
    await db.query(`INSERT INTO typing_states(conversation_id,user_id,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(conversation_id,user_id) DO UPDATE SET updated_at=NOW()`,[conversationId,user.id]);
  }else{
    await db.query('DELETE FROM typing_states WHERE conversation_id=$1 AND user_id=$2',[conversationId,user.id]);
  }
  return NextResponse.json({ok:true});
}

export async function GET(_req:NextRequest,{params}:Params){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {conversationId}=await params;
  await db.query(`DELETE FROM typing_states WHERE updated_at < NOW()-INTERVAL '5 seconds'`);
  const r=await db.query(`SELECT u.id,u.username,u.display_name AS "displayName" FROM typing_states t JOIN users u ON u.id=t.user_id WHERE t.conversation_id=$1 AND t.user_id<>$2 AND t.updated_at>NOW()-INTERVAL '5 seconds'`,[conversationId,user.id]);
  return NextResponse.json({typing:r.rows});
}
