// Shared strict format for the small excerpts stored with postcards: mono PCM16 WAV.
export const CLIP_RATE=22050;
export const MAX_CLIP_BYTES=44+CLIP_RATE*2*20;
export function inspectClip(bytes:ArrayBuffer){
  if(bytes.byteLength<44||bytes.byteLength>MAX_CLIP_BYTES)throw new Error('音乐片段大小不正确。');
  const v=new DataView(bytes),s=(at:number,n:number)=>String.fromCharCode(...new Uint8Array(bytes,at,n));
  const size=bytes.byteLength-44,duration=size/(CLIP_RATE*2);
  if(s(0,4)!=='RIFF'||s(8,4)!=='WAVE'||s(12,4)!=='fmt '||s(36,4)!=='data'||v.getUint32(4,true)!==bytes.byteLength-8||v.getUint32(16,true)!==16||v.getUint16(20,true)!==1||v.getUint16(22,true)!==1||v.getUint32(24,true)!==CLIP_RATE||v.getUint32(28,true)!==CLIP_RATE*2||v.getUint16(32,true)!==2||v.getUint16(34,true)!==16||v.getUint32(40,true)!==size||!Number.isInteger(duration)||duration<8||duration>20)throw new Error('请上传 8—20 秒的标准音乐片段。');
  return duration;
}
