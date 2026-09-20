import {TRACKS,type TrackId} from './moment';
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
function getBuffer(id:TrackId){if(!cache.has(id))cache.set(id,render(id).catch(e=>{cache.delete(id);throw e;}));return cache.get(id)!;}
export class SoundPlayer{
  context:AudioContext|null=null;master:GainNode|null=null;voice:{source:AudioBufferSourceNode;gain:GainNode}|null=null;playing=false;track:TrackId|null=null;position=0;startTime=0;limit=48;wave:number[]=[];token=0;volume=.65;timer:ReturnType<typeof setInterval>|null=null;
  constructor(private notify:(s:Snapshot)=>void){}
  current(){return this.playing&&this.context?Math.min(this.limit,Math.max(0,this.context.currentTime-this.startTime)):this.position;}
  snapshot(){return {playing:this.playing,position:this.current(),duration:48,track:this.track,wave:this.wave};}
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
  async play(id:TrackId,start=0,end=48){
    const token=++this.token;await this.init();const {buffer,wave}=await this.prepare(id);if(token!==this.token)return;
    this.dispose();this.track=id;this.position=start;this.wave=wave;this.limit=end;
    const ctx=this.context!;const at=ctx.currentTime+.025;const source=ctx.createBufferSource();source.buffer=buffer;
    const gain=ctx.createGain();gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+.08);gain.gain.setValueAtTime(1,at+end-start-.15);gain.gain.linearRampToValueAtTime(0,at+end-start);
    source.connect(gain);gain.connect(this.master!);source.start(at,start,end-start);this.voice={source,gain};this.playing=true;this.startTime=at-start;
    source.onended=()=>{if(this.voice?.source===source){this.playing=false;this.position=end;this.voice=null;clearInterval(this.timer!);this.timer=null;source.disconnect();gain.disconnect();this.emit();}};
    clearInterval(this.timer!);this.timer=setInterval(()=>this.emit(),100);this.emit();
  }
  pause(){this.token++;this.position=this.current();this.dispose();this.playing=false;clearInterval(this.timer!);this.timer=null;this.emit();}
  stop(){this.pause();this.position=0;this.emit();}
  setVolume(volume:number){this.volume=volume;if(this.context&&this.master)this.master.gain.setTargetAtTime(volume,this.context.currentTime,.02);}
  async close(){this.pause();await this.context?.close();}
}
