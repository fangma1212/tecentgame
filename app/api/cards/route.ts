import {rawDb,cardColumns,json,body,uuid} from '@/db/raw';
import {validateCard,TRACKS} from '@/lib/moment';
import {audioMetadata,bucket,withAudio} from '@/db/audio';
export async function POST(request:Request){
  let input,key;
  let payload;
  try{payload=await body(request);key=payload.requestKey;if(!uuid(key))throw new Error('保存请求不完整，请刷新后重试。');}catch(error){return json({error:error instanceof Error?error.message:'请检查填写内容。'},400);}
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
    const db=rawDb();const id=crypto.randomUUID();
    await db.prepare('INSERT INTO moment_cards (id,request_key,track,clip_start,clip_end,message,to_name,from_name,theme,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(id,key,input.track,input.start,input.end,input.message,input.toName,input.fromName,input.theme,Date.now()).run();
    const card=await db.prepare(`SELECT ${cardColumns} FROM moment_cards WHERE request_key = ?`).bind(key).first();
    if(!card)return json({error:'暂时没能保存，请再试一次。'},503);
    for(const [field,value] of Object.entries(input))if(field!=='audio'&&card[field]!==value)return json({error:'这次保存的内容发生了变化，请重新生成。'},409);
    return json({card:await withAudio(card as typeof card&{track:string})},201);
  }catch(error){console.error('card_create_failed',error instanceof Error?error.name:'StorageError');return json({error:'暂时无法保存，留言还在。请稍后重试。'},503);}
}
