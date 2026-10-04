import {rawDb,cardColumns,replyColumns,json,uuid} from '@/db/raw';
import {withAudio} from '@/db/audio';
import {readConversation} from '@/db/conversation';
import type {Card} from '@/lib/moment';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!uuid(id))return json({error:'这张明信片的地址不正确。'},404);
  const before=new URL(request.url).searchParams.get('before');if(before&&!uuid(before))return json({error:'往来记录地址不正确。'},400);
  try{const db=rawDb();const card=await db.prepare(`SELECT ${cardColumns} FROM moment_cards WHERE id = ?`).bind(id).first();if(!card)return json({error:'没有找到这张明信片，请向寄信人确认链接。'},404);
    const conversation=await readConversation(card as Card,before);if(!conversation)return json({error:'没有找到这段往来记录。'},400);
    const replies=await db.prepare(`SELECT ${replyColumns} FROM moment_replies WHERE card_id = ? ORDER BY created_at ASC LIMIT 20`).bind(id).all();return json({card:await withAudio(card as typeof card&{track:string}),replies:replies.results,conversation});
  }catch(error){console.error('card_read_failed',error instanceof Error?error.name:'StorageError');return json({error:'暂时无法打开明信片，请稍后再试。'},503);}
}
