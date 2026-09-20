import {rawDb,cardColumns,replyColumns,json,uuid} from '@/db/raw';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!uuid(id))return json({error:'这张明信片的地址不正确。'},404);
  try{const db=rawDb();const card=await db.prepare(`SELECT ${cardColumns} FROM moment_cards WHERE id = ?`).bind(id).first();if(!card)return json({error:'没有找到这张明信片，请向寄信人确认链接。'},404);
    const replies=await db.prepare(`SELECT ${replyColumns} FROM moment_replies WHERE card_id = ? ORDER BY created_at ASC LIMIT 20`).bind(id).all();return json({card,replies:replies.results});
  }catch(error){console.error('card_read_failed',error instanceof Error?error.name:'StorageError');return json({error:'暂时无法打开明信片，请稍后再试。'},503);}
}
