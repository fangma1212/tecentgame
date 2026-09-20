import {json,uuid} from '@/db/raw';
import {bucket,audioMetadata} from '@/db/audio';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!uuid(id))return json({error:'音乐地址不正确。'},404);
  try{
    if(!await audioMetadata(id))return json({error:'这段音乐不存在。'},404);
    const object=await bucket().get(`clips/${id}.wav`);if(!object)return json({error:'音乐还没准备好，请稍后再试。'},404);
    return new Response(object.body,{headers:{'Content-Type':'audio/wav','Content-Length':String(object.size),'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="music-moment.wav"'}});
  }catch(e){console.error('audio_read_failed',e instanceof Error?e.name:'StorageError');return json({error:'音乐暂时无法加载，请稍后再试。'},503);}
}
