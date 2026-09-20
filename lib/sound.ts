import {TRACKS,type TrackId} from './moment';
import {CLIP_RATE} from './audio-file';
type Snapshot={playing:boolean;position:number;duration:number;track:TrackId|null;wave:number[]};
const hz=(note:number)=>440*Math.pow(2,(note-69)/12);
const cache=new Map<TrackId,Promise<AudioBuffer>>();
function note(ctx:OfflineAudioContext,out:AudioNode,start:number,midi:number,length:number,kind:TrackId,velocity:number){
  const harmonics=kind==='rain'?[1,2.01,3.99]:kind==='home'?[1,2,3]:[1,2,3.01];
  harmonics.forEach((multiple,i)=>{
    const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=hz(midi)*multiple;
    const gain=ctx.createGain();const peak=velocity*(i===0?1:i===1?.22:.055);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(peak,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length/(i+1));
    osc.connect(gain);gain.connect(out);osc.start(start);osc.stop(start+length+.03);
  });
}
async function render(id:TrackId){
  const ctx=new OfflineAudioContext(2,44100*48,44100);
  const output=ctx.createGain();output.gain.value=.75;
  const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=14;limiter.ratio.value=3;output.connect(limiter);limiter.connect(ctx.destination);
  const echo=ctx.createDelay(1);echo.delayTime.value=.375;const echoVolume=ctx.createGain();echoVolume.gain.value=.18;output.connect(echo);echo.connect(echoVolume);echoVolume.connect(limiter);
  const base=id==='rain'?57:id==='home'?65:60;
  const chords=[[0,4,7,11],[-3,0,4,7],[-7,-3,0,4],[-5,-1,2,7]];
  const melody=[12,16,19,16,14,12,11,7,12,14,16,19,21,19,16,14];
  for(let bar=0;bar<16;bar++){
    const chord=chords[bar%4];const start=bar*3;
    chord.forEach((n,i)=>note(ctx,output,start+i*.04,base+n,2.75,id,.043));
    note(ctx,output,start,base+chord[0]-12,2.7,id,.11);
    for(let beat=0;beat<4;beat++){
      const i=(bar*3+beat+(id==='rain'?3:0))%melody.length;
      if(id==='rain'&&beat===3)continue;
      note(ctx,output,start+beat*.75,base+melody[i],id==='home'?.65:1.2,id,id==='home'?.1:.075);
      if(id==='home'&&beat%2===1)note(ctx,output,start+beat*.75+.375,base+chord[beat%4]+12,.32,id,.025);
    }
  }
  const buffer=await ctx.startRendering();
  for(let ch=0;ch<2;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<2205;i++){data[i]*=i/2205;data[data.length-1-i]*=i/2205;}}
  return buffer;
}
async function loadClip(id:string){
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('请重新导入这首音乐，选好的文字还在。');
  const response=await fetch(`/api/audio/${id}`);if(!response.ok)throw new Error('这段音乐暂时无法加载，请稍后重试。');
  const ctx=new OfflineAudioContext(1,1,44100);return ctx.decodeAudioData(await response.arrayBuffer());
}
function getBuffer(id:TrackId){if(!cache.has(id))cache.set(id,(TRACKS.some(t=>t.id===id)?render(id):loadClip(id)).catch(e=>{cache.delete(id);throw e;}));return cache.get(id)!;}
export async function importAudio(file:File){
  if(!/\.(mp3|wav|m4a|ogg)$/i.test(file.name))throw new Error('请选择 MP3、WAV、M4A 或 OGG 音频文件。');
  if(!file.size||file.size>20*1024*1024)throw new Error('请选择 20 MB 以内的音频文件。');
  let buffer:AudioBuffer;
  try{buffer=await new OfflineAudioContext(1,1,44100).decodeAudioData(await file.arrayBuffer());}catch{throw new Error('无法读取这首音乐，请换一个可播放的 MP3 或 WAV 文件。');}
  if(buffer.duration<8||buffer.duration>300.1)throw new Error('请选择 8 秒到 5 分钟的音乐。');
  const id=`local:${crypto.randomUUID()}`;cache.set(id,Promise.resolve(buffer));return {id,duration:Math.floor(buffer.duration),start:recommendSegment(buffer)};
}
export function forgetAudio(id:string){if(id.startsWith('local:'))cache.delete(id);}
function recommendSegment(buffer:AudioBuffer){
  const length=Math.min(12,Math.floor(buffer.duration));const energy:number[]=[];
  for(let sec=0;sec<Math.floor(buffer.duration);sec++){
    let sum=0,count=0;
    for(let ch=0;ch<buffer.numberOfChannels;ch++){const d=buffer.getChannelData(ch);for(let i=Math.floor(sec*buffer.sampleRate);i<Math.min(d.length,(sec+1)*buffer.sampleRate);i+=100){sum+=d[i]*d[i];count++;}}
    energy.push(sum/Math.max(1,count));
  }
  let best=0,score=-1;
  for(let i=0;i<=energy.length-length;i++){const slice=energy.slice(i,i+length),current=slice.reduce((a,b)=>a+b,0)/length;if(current>score){score=current;best=i;}}
  return best;
}
export async function exportClip(id:string,start:number,end:number){
  const buffer=await getBuffer(id),length=end-start;
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>buffer.duration||length<8||length>20)throw new Error('请重新选择 8—20 秒的片段。');
  const ctx=new OfflineAudioContext(1,CLIP_RATE*length,CLIP_RATE),source=ctx.createBufferSource();source.buffer=buffer;
  const gain=ctx.createGain();gain.gain.setValueAtTime(0,0);gain.gain.linearRampToValueAtTime(1,.06);gain.gain.setValueAtTime(1,length-.12);gain.gain.linearRampToValueAtTime(0,length);
  source.connect(gain);gain.connect(ctx.destination);source.start(0,start,length);const rendered=await ctx.startRendering(),samples=rendered.getChannelData(0);
  const result=new ArrayBuffer(44+samples.length*2),view=new DataView(result);
  const text=(at:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i));};
  text(0,'RIFF');view.setUint32(4,result.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,CLIP_RATE,true);view.setUint32(28,CLIP_RATE*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
  for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,s<0?s*32768:s*32767,true);}
  return result;
}
export class SoundPlayer{
  context:AudioContext|null=null;master:GainNode|null=null;voice:{source:AudioBufferSourceNode;gain:GainNode}|null=null;playing=false;track:TrackId|null=null;position=0;startTime=0;limit=48;duration=48;wave:number[]=[];token=0;volume=.65;timer:ReturnType<typeof setInterval>|null=null;
  constructor(private notify:(s:Snapshot)=>void){}
  current(){return this.playing&&this.context?Math.min(this.limit,Math.max(this.position,this.context.currentTime-this.startTime)):this.position;}
  snapshot(){return {playing:this.playing,position:this.current(),duration:this.duration,track:this.track,wave:this.wave};}
  emit(){this.notify(this.snapshot());}
  async prepare(id:TrackId){
    const buffer=await getBuffer(id);const data=buffer.getChannelData(0);const wave=[];
    for(let i=0;i<80;i++){const begin=Math.floor(i*data.length/80),end=Math.floor((i+1)*data.length/80);let energy=0;for(let j=begin;j<end;j+=20)energy+=data[j]**2;wave.push(Math.sqrt(energy/Math.ceil((end-begin)/20)));}
    const max=Math.max(...wave,.001);return {buffer,wave:wave.map(v=>Math.max(.08,v/max))};
  }
  async init(){
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);}
    if(this.context.state==='suspended')await this.context.resume();
    if(this.context.state!=='running')throw new Error('声音还没启动，请再点一次播放。');
  }
  dispose(){const voice=this.voice;if(voice&&this.context){voice.source.onended=null;voice.gain.gain.cancelScheduledValues(this.context.currentTime);voice.gain.gain.setTargetAtTime(0,this.context.currentTime,.012);try{voice.source.stop(this.context.currentTime+.06);}catch{}voice.source.onended=()=>{voice.source.disconnect();voice.gain.disconnect();};}this.voice=null;}
  async play(id:TrackId,start=0,end?:number){
    const token=++this.token;await this.init();const {buffer,wave}=await this.prepare(id);if(token!==this.token)return;
    end=Math.min(end??buffer.duration,buffer.duration);if(start<0||start>=end)throw new Error('请重新选择音乐片段。');
    this.dispose();this.track=id;this.position=start;this.wave=wave;this.limit=end;this.duration=buffer.duration;
    const ctx=this.context!;const at=ctx.currentTime+.025;const source=ctx.createBufferSource();source.buffer=buffer;
    const gain=ctx.createGain(),fade=Math.min(.08,(end-start)/3);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+fade);gain.gain.setValueAtTime(1,at+end-start-fade);gain.gain.linearRampToValueAtTime(0,at+end-start);
    source.connect(gain);gain.connect(this.master!);source.start(at,start,end-start);this.voice={source,gain};this.playing=true;this.startTime=at-start;
    source.onended=()=>{if(this.voice?.source===source){this.playing=false;this.position=end;this.voice=null;clearInterval(this.timer!);this.timer=null;source.disconnect();gain.disconnect();this.emit();}};
    clearInterval(this.timer!);this.timer=setInterval(()=>this.emit(),100);this.emit();
  }
  pause(){this.token++;this.position=this.current();this.dispose();this.playing=false;clearInterval(this.timer!);this.timer=null;this.emit();}
  stop(){this.pause();this.position=0;this.emit();}
  setVolume(volume:number){this.volume=volume;if(this.context&&this.master)this.master.gain.setTargetAtTime(volume,this.context.currentTime,.02);}
  async close(){this.pause();await this.context?.close();}
}
