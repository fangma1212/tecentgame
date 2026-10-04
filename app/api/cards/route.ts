import {rawDb,cardColumns,json,body,uuid} from '@/db/raw';
import {validateCard,TRACKS} from '@/lib/moment';
import {audioMetadata,bucket,withAudio} from '@/db/audio';
import {readConversation} from '@/db/conversation';
import type {Card} from '@/lib/moment';
export async function POST(request:Request){
  let input,key;
  let payload;
  let parentCardId:string|null=null;
  try{payload=await body(request);key=payload.requestKey;if(!uuid(key))throw new Error('保存请求不完整，请刷新后重试。');if(payload.parentCardId!=null){if(!uuid(payload.parentCardId))throw new Error('回信地址不正确，请重新打开原信。');parentCardId=payload.parentCardId;}}catch(error){return json({error:error instanceof Error?error.message:'请检查填写内容。'},400);}
  try{
    try{
      let audio;
      if(!TRACKS.some(t=>t.id===payload.card?.track)){
        if(!uuid(payload.card?.track))return json({error:'请先导入并保存音乐片段。'},400);
        audio=await audioMetadata(payload.card.track);
        if(!audio||!await bucket().head(`clips/${payload.card.track}.wav`))return json({error:'音乐片段尚未保存，请重新生成。'},400);
      }
      input=validateCard({...payload.card,audio});
    }catch(error){if(error instanceof Error&&/请选择|请写下|称呼|请填写/.test(error.message))return json({error:error.message},400);throw error;}
    const db=rawDb();const id=crypto.randomUUID();let threadId:string|null=null;
    if(parentCardId){const parent=await db.prepare('SELECT id,thread_id AS threadId FROM moment_cards WHERE id = ?').bind(parentCardId).first<{id:string;threadId:string|null}>();if(!parent)return json({error:'原信没有找到，回信还在。请确认原信链接。'},404);threadId=parent.threadId||parent.id;}
    await db.prepare('INSERT INTO moment_cards (id,request_key,track,clip_start,clip_end,message,to_name,from_name,theme,created_at,parent_card_id,thread_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(id,key,input.track,input.start,input.end,input.message,input.toName,input.fromName,input.theme,Date.now(),parentCardId,threadId).run();
    const card=await db.prepare(`SELECT ${cardColumns} FROM moment_cards WHERE request_key = ?`).bind(key).first();
    if(!card)return json({error:'暂时没能保存，请再试一次。'},503);
    for(const [field,value] of Object.entries(input))if(field!=='audio'&&card[field]!==value)return json({error:'这次保存的内容发生了变化，请重新生成。'},409);
    if(card.parentCardId!==parentCardId)return json({error:'回信对象发生了变化，请重新生成。'},409);
    return json({card:await withAudio(card as typeof card&{track:string}),conversation:await readConversation(card as Card,null)},201);
  }catch(error){console.error('card_create_failed',error instanceof Error?error.name:'StorageError');return json({error:'暂时无法保存，留言还在。请稍后重试。'},503);}
}
