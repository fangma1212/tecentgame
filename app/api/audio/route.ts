import {rawDb,json,uuid} from '@/db/raw';
import {bucket,audioMetadata} from '@/db/audio';
import {inspectClip,MAX_CLIP_BYTES} from '@/lib/audio-file';

async function limitedBytes(request:Request){
  if(Number(request.headers.get('content-length'))>MAX_CLIP_BYTES)throw new Error('音乐片段太大，请重新选择。');
  const reader=request.body?.getReader();if(!reader)throw new Error('没有收到音乐片段。');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_CLIP_BYTES){await reader.cancel();throw new Error('音乐片段太大，请重新选择。');}chunks.push(value);}}finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result.buffer;
}
export async function POST(request:Request){
  let bytes:ArrayBuffer,id:string,title:string,artist:string,sourceStart:number,duration:number;
  try{
    if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('请从本站导入音乐。');
    if(request.headers.get('content-type')!=='audio/wav')throw new Error('音乐格式不正确。');
    id=request.headers.get('x-clip-id')||'';if(!uuid(id))throw new Error('导入请求不完整，请重试。');
    title=decodeURIComponent(request.headers.get('x-song-title')||'').trim();artist=decodeURIComponent(request.headers.get('x-song-artist')||'').trim();sourceStart=Number(request.headers.get('x-source-start'));
    if(!title||title.length>80||artist.length>60||!Number.isInteger(sourceStart)||sourceStart<0||sourceStart>292||request.headers.get('x-audio-permission')!=='confirmed')throw new Error('请填写歌名并确认这段音频可以用于分享。');
    bytes=await limitedBytes(request);duration=inspectClip(bytes);if(sourceStart+duration>300)throw new Error('音乐片段范围不正确。');
  }catch(e){return json({error:e instanceof Error?e.message:'无法读取音乐片段。'},400);}
  try{
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    const db=rawDb();
    // A request ID permanently describes one exact clip, including its display metadata.
    await db.prepare('INSERT INTO moment_audio (id,title,artist,duration,source_start,digest,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,title,artist,duration,sourceStart,digest,Date.now()).run();
    const stored=await db.prepare('SELECT digest,title,artist,source_start AS sourceStart FROM moment_audio WHERE id = ?').bind(id).first();
    if(!stored||stored.digest!==digest||stored.title!==title||stored.artist!==artist||stored.sourceStart!==sourceStart)return json({error:'片段内容已变化，请重新生成明信片。'},409);
    await bucket().put(`clips/${id}.wav`,bytes,{httpMetadata:{contentType:'audio/wav'}});
    return json({audio:await audioMetadata(id)},201);
  }catch(e){console.error('audio_save_failed',e instanceof Error?e.name:'StorageError');return json({error:'音乐暂时没能保存，你选好的片段还在，请重试。'},503);}
}
