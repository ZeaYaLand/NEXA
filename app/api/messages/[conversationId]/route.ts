import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; import { getCurrentUser } from '@/lib/auth';
type Params={params:Promise<{conversationId:string}>};

async function blockedByDirectMember(conversationId:string,userId:string){
 const r=await db.query(`SELECT 1 FROM conversations c JOIN conversation_members other ON other.conversation_id=c.id AND other.user_id<>$2 JOIN user_blocks b ON (b.blocker_id=$2 AND b.blocked_id=other.user_id) OR (b.blocker_id=other.user_id AND b.blocked_id=$2) WHERE c.id=$1 AND c.type='direct' LIMIT 1`,[conversationId,userId]);
 return !!r.rowCount;
}

export async function GET(_req:NextRequest,{params}:Params){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const{conversationId}=await params;
 await db.query('ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ');
 const member=await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[conversationId,user.id]);
 if(!member.rowCount)return NextResponse.json({error:'Forbidden'},{status:403});
 if(await blockedByDirectMember(conversationId,user.id))return NextResponse.json({error:'Пользователь заблокирован'},{status:403});
 const r=await db.query(`SELECT m.id,m.content,m.created_at,m.sender_id,m.media_url,m.media_type,m.file_name,m.file_size,m.mime_type,m.media_duration_seconds,u.username,u.display_name AS "displayName" FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at ASC LIMIT 200`,[conversationId]);
 await db.query('UPDATE conversation_members SET last_read_at=NOW() WHERE conversation_id=$1 AND user_id=$2',[conversationId,user.id]);
 return NextResponse.json({messages:r.rows});
}

export async function POST(req:NextRequest,{params}:Params){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const{conversationId}=await params;
 await db.query('ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ');
 const member=await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[conversationId,user.id]);
 if(!member.rowCount)return NextResponse.json({error:'Forbidden'},{status:403});
 if(await blockedByDirectMember(conversationId,user.id))return NextResponse.json({error:'Пользователь заблокирован'},{status:403});
 const b=await req.json(),content=String(b.content||'').trim();
 const mediaUrl=b.mediaUrl?String(b.mediaUrl):null,mediaType=b.mediaType?String(b.mediaType):null,fileName=b.fileName?String(b.fileName):null,fileSize=b.fileSize==null?null:Number(b.fileSize),mimeType=b.mimeType?String(b.mimeType):null,mediaDuration=b.mediaDuration==null?null:Number(b.mediaDuration);
 if(!content && !mediaUrl)return NextResponse.json({error:'Invalid message'},{status:400});
 if(content.length>5000)return NextResponse.json({error:'Invalid message'},{status:400});
 if(mediaUrl && !mediaUrl.startsWith(`messages/${conversationId}/${user.id}/`))return NextResponse.json({error:'Invalid media key'},{status:400});
 const r=await db.query(`INSERT INTO messages(conversation_id,sender_id,content,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,content,created_at,sender_id,media_url,media_type,file_name,file_size,mime_type,media_duration_seconds`,[conversationId,user.id,content||' ',mediaUrl,mediaType,fileName,fileSize,mimeType,mediaDuration]);
 return NextResponse.json({message:{...r.rows[0],username:user.username,displayName:user.displayName}},{status:201});
}

export async function DELETE(req:NextRequest,{params}:Params){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const{conversationId}=await params;const member=await db.query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[conversationId,user.id]);if(!member.rowCount)return NextResponse.json({error:'Forbidden'},{status:403});const id=new URL(req.url).searchParams.get('messageId');if(!id)return NextResponse.json({error:'messageId is required'},{status:400});const r=await db.query('DELETE FROM messages WHERE id=$1 AND conversation_id=$2 AND sender_id=$3 RETURNING id',[id,conversationId,user.id]);if(!r.rowCount)return NextResponse.json({error:'Message not found or not yours'},{status:404});return NextResponse.json({ok:true,id});}
