import {rawDb,replyColumns,json,body,uuid} from '@/db/raw';
import {REACTIONS} from '@/lib/moment';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!uuid(id))return json({error:'明信片地址不正确。'},404);
  let value;
  try{value=await body(request);if(!uuid(value.requestKey)||!REACTIONS.includes(value.reaction)||typeof value.name!=='string'||value.name.trim().length>20||typeof value.message!=='string'||value.message.trim().length>120)throw new Error('请检查回应，称呼最多 20 字，留言最多 120 字。');}catch(error){return json({error:error instanceof Error?error.message:'回应格式不正确。'},400);}
  try{
    const db=rawDb();if(!await db.prepare('SELECT id FROM moment_cards WHERE id = ?').bind(id).first())return json({error:'明信片不存在。'},404);
    await db.prepare('INSERT INTO moment_replies (id,card_id,request_key,name,reaction,message,created_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM moment_replies WHERE card_id = ?) < 20 ON CONFLICT(request_key) DO NOTHING').bind(crypto.randomUUID(),id,value.requestKey,value.name.trim()||'收到音乐的人',value.reaction,value.message.trim(),Date.now(),id).run();
    const reply=await db.prepare(`SELECT ${replyColumns} FROM moment_replies WHERE request_key = ? AND card_id = ?`).bind(value.requestKey,id).first();
    if(!reply)return json({error:'这张明信片已收下 20 条回应，感谢你的心意。'},409);
    if(reply.reaction!==value.reaction||reply.message!==value.message.trim()||reply.name!==(value.name.trim()||'收到音乐的人'))return json({error:'回应内容已变化，请重新提交。'},409);
    return json({reply},201);
  }catch(error){console.error('reply_create_failed',error instanceof Error?error.name:'StorageError');return json({error:'回应暂时没有保存，请稍后重试。'},503);}
}
