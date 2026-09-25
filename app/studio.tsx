'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,Check,CheckCheck,Copy,Eye,Heart,Headphones,Mail,Music2,Pause,Play,Send,Sparkles,Volume2,Loader2,ExternalLink,RefreshCw,Upload} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Slider} from '@/components/ui/slider';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {TRACKS,THEMES,DEFAULT_DRAFT,SAMPLE_CARD,clock,validateCard,trackInfo,originalTime,type AudioMeta,type CardInput,type Card,type TrackId,type Reply} from '@/lib/moment';
import {SoundPlayer,importAudio,exportClip,forgetAudio} from '@/lib/sound';
import {useDraftTool} from '@/lib/use-webmcp';
import {Postcard,ListenCard} from './visuals';
type ApiResult={card:Card;replies:Reply[];error?:string};

const DRAFT_KEY='this-moment-draft-v1',LAST_KEY='this-moment-last-card';
export function Brand(){return <a className="brand" href="/" aria-label="这一秒想到你首页"><span className="brand-mark"><Mail size={22}/><Music2 className="brand-note" size={12}/></span><span>这一秒，想到你<small>A LITTLE MUSIC, A LOT OF YOU.</small></span></a>;}

export default function MomentStudio(){
  const [draft,setDraft]=useState<CardInput>({...DEFAULT_DRAFT});const [step,setStep]=useState('music');
  const [sound,setSound]=useState({playing:false,position:0,duration:48,track:null as TrackId|null,wave:[] as number[]});
  const [wave,setWave]=useState<number[]>([]);const [volume,setVolume]=useState(65);const [audioBusy,setAudioBusy]=useState(false);
  const [notice,setNotice]=useState('');const [saving,setSaving]=useState(false);const [saved,setSaved]=useState<Card|null>(null);const [url,setUrl]=useState('');const [copied,setCopied]=useState(false);const [preview,setPreview]=useState(false);const [ready,setReady]=useState(false);const [replies,setReplies]=useState<Reply[]>([]);const [refreshing,setRefreshing]=useState(false);
  const player=useRef<SoundPlayer|null>(null);const saveKey=useRef<string|null>(null);const audioJob=useRef(0);
  const [mood,setMood]=useState('全部');
  const [libraryOpen,setLibraryOpen]=useState(true);
  const [imported,setImported]=useState<(AudioMeta&{recommended:number})|null>(null);
  const [permission,setPermission]=useState(false);
  const [needsImport,setNeedsImport]=useState(false);
  const [showPreviewShortcut,setShowPreviewShortcut]=useState(true);
  const localAudio=useRef<string|null>(null);
  const active=trackInfo(draft),duration=active.duration;
  const isLocal=draft.track.startsWith('local:');
  const shownTracks=TRACKS.filter(t=>mood==='全部'||t.mood===mood);

  useDraftTool({step,...draft,savedId:saved?.id??null});
  useEffect(()=>{
    const engine=new SoundPlayer(setSound);player.current=engine;
    try{const stored=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(stored){if(stored.track?.startsWith('local:')){setNeedsImport(true);stored.track='sunset';stored.audio=undefined;stored.start=12;stored.end=24;setNotice('留言草稿还在，请重新导入上次选择的音乐文件。');}const valid=validateCard({...stored,message:stored.message?.trim()||'草稿'});setDraft({...valid,message:typeof stored.message==='string'?stored.message:'',toName:stored.toName,fromName:stored.fromName});}}catch{}
    let last:string|null=null;try{last=localStorage.getItem(LAST_KEY);}catch{}
    if(last&&/^[0-9a-f-]{36}$/.test(last))fetch(`/api/cards/${last}`).then(async r=>{if(!r.ok)return;const data=await r.json() as ApiResult;setSaved(data.card);setDraft(data.card);setReplies(data.replies);setUrl(`${location.origin}/card/${last}`);setStep('send');}).catch(()=>{});
    setReady(true);
    const hidden=()=>{if(document.hidden){engine.pause();audioJob.current++;setAudioBusy(false);}};
    document.addEventListener('visibilitychange',hidden);
    return()=>{audioJob.current++;engine.close();if(localAudio.current)forgetAudio(localAudio.current);document.removeEventListener('visibilitychange',hidden);player.current=null;};
  },[]);
  useEffect(()=>{if(ready)try{localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}catch{}},[draft,ready]);
  useEffect(()=>{const update=()=>{const card=document.querySelector('.preview-column')?.getBoundingClientRect();setShowPreviewShortcut(!card||card.top>window.innerHeight-80||card.bottom<0);};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[]);
  useEffect(()=>{let live=true;player.current?.prepare(draft.track).then(result=>{if(live)setWave(result.wave);}).catch(()=>{if(live)setNotice('音乐暂时没能准备好，点击播放可以重试。');});return()=>{live=false;};},[draft.track,ready]);
  function edit(patch:Partial<CardInput>){setDraft(d=>({...d,...patch}));setSaved(null);setUrl('');setReplies([]);setCopied(false);saveKey.current=null;setNotice('');try{localStorage.removeItem(LAST_KEY);}catch{}}
  async function runSound(task:()=>Promise<void>){const job=++audioJob.current;setAudioBusy(true);setNotice('');try{await task();}catch(e){setNotice(e instanceof Error?e.message:'声音未能启动，请再试一次。');}finally{if(job===audioJob.current)setAudioBusy(false);}}
  async function chooseTrack(id:TrackId){setNeedsImport(false);player.current?.stop();edit({track:id,audio:undefined,start:12,end:24});await runSound(()=>player.current!.play(id));}
  async function toggleFull(){if(sound.playing){player.current?.pause();return;}await runSound(()=>player.current!.play(draft.track,sound.track===draft.track&&sound.position<duration-.2?sound.position:0,duration));}
  async function playClip(){player.current?.pause();await runSound(()=>player.current!.play(draft.track,draft.start,draft.end));}
  function capture(){const length=Math.min(12,duration),start=Math.min(duration-length,Math.max(0,Math.floor(sound.track===draft.track?sound.position:0)));edit({start,end:start+length});setNotice(`已经留下 ${clock(originalTime(draft,start))} 开始的 ${length} 秒。`);}
  async function selectFile(file:File){
    player.current?.stop();await runSound(async()=>{
      const loaded=await importAudio(file);if(localAudio.current)forgetAudio(localAudio.current);localAudio.current=loaded.id;
      const audio={id:loaded.id,title:file.name.replace(/\.[^.]+$/,'').slice(0,80)||'我的音乐',artist:'',duration:loaded.duration,sourceStart:0,recommended:loaded.start};
      setImported(audio);setPermission(false);setNeedsImport(false);setLibraryOpen(false);edit({track:audio.id,audio,start:loaded.start,end:loaded.start+Math.min(12,loaded.duration)});setNotice('已选好一段供你试听，也可以拖动端点，留下你喜欢的几秒。');
    });
  }
  function useRecommendation(){player.current?.stop();const start=isLocal?(imported?.recommended||0):draft.audio?0:12;edit({start,end:start+Math.min(12,duration)});}
  function changeRange(values:number[]){let [start,end]=values;if(end-start>20){if(start!==draft.start)end=start+20;else start=end-20;}player.current?.pause();edit({start,end});}
  function go(next:string){setNotice('');if(next==='send'&&needsImport){setNotice('请重新导入音乐，或明确选择一首试听集里的音乐。');setStep('music');return;}if(next==='send'){try{validateCard(draft);}catch(e){setNotice((e as Error).message);setStep('note');return;}}setStep(next);}
  async function create(){
    if(needsImport){setNotice('请重新导入音乐，或明确选择一首试听集里的音乐。');setStep('music');return;}
    let card;try{card=validateCard(draft);}catch(e){setNotice((e as Error).message);setStep('note');return;}
    if(isLocal&&!permission){setNotice('请先确认导入的音频可以用于这次分享。');setStep('music');return;}
    setSaving(true);setNotice('');player.current?.pause();saveKey.current??=crypto.randomUUID();
    try{
      if(isLocal){
        setNotice('正在保存你选中的音乐片段…');
        const bytes=await exportClip(draft.track,draft.start,draft.end);
        const uploaded=await fetch('/api/audio',{method:'POST',headers:{'Content-Type':'audio/wav','x-clip-id':saveKey.current,'x-song-title':encodeURIComponent(draft.audio!.title.trim()),'x-song-artist':encodeURIComponent(draft.audio!.artist.trim()),'x-source-start':String(draft.start),'x-audio-permission':'confirmed'},body:bytes});
        const result=await uploaded.json() as {audio:AudioMeta;error?:string};if(!uploaded.ok)throw new Error(result.error||'音乐保存失败，请重试。');
        card={...card,track:result.audio.id,audio:result.audio,start:0,end:draft.end-draft.start};
      }
      const response=await fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card,requestKey:saveKey.current})});const data=await response.json() as ApiResult;if(!response.ok)throw new Error(data.error||'暂时未能保存，请重试。');setSaved(data.card);setDraft(data.card);setUrl(`${location.origin}/card/${data.card.id}`);setReplies([]);try{localStorage.setItem(LAST_KEY,data.card.id);}catch{}setNotice('明信片已保存，把链接发给你想到的人吧。');}
    catch(e){setNotice(e instanceof TypeError?'连接暂时中断，留言还在，请重试。':e instanceof Error?e.message:'连接暂时中断，留言还在，请重试。');}finally{setSaving(false);}
  }
  async function copy(){try{await navigator.clipboard.writeText(url);setCopied(true);setNotice('链接已复制，你可以粘贴给对方。');}catch{const input=document.querySelector<HTMLInputElement>('#share-url');input?.focus();input?.select();setNotice('请长按链接，或使用 Ctrl+C 复制。');}}
  async function refresh(){if(!saved)return;setRefreshing(true);try{const r=await fetch(`/api/cards/${saved.id}`);const data=await r.json() as ApiResult;if(!r.ok)throw new Error(data.error);setReplies(data.replies);setNotice(data.replies.length?'回应已更新。':'暂时还没有回应，给这份心意一点时间。');}catch{setNotice('暂时无法刷新回应，请稍后再试。');}finally{setRefreshing(false);}}
  const previewCard:Card={...draft,id:'preview',message:draft.message||SAMPLE_CARD.message,toName:draft.toName||'想到的你',fromName:draft.fromName||'一个想你的人',createdAt:0};
  return <div className="app-shell">
    <header className="site-header"><Brand/><span className="header-caption">把没说出口的话，藏进一小段音乐。</span><a className="quiet-link" href="/sample"><Headphones size={17}/>体验一封来信<ArrowRight size={14}/></a></header>
    {showPreviewShortcut&&<button type="button" className="mobile-preview-action" aria-label="预览明信片" onClick={()=>{player.current?.pause();setPreview(true);}}><Eye size={17}/>预览</button>}
    <main className="studio-main">
      <div className="page-heading"><div><p className="eyebrow"><span/>一封可以听见的明信片</p><h1>刚好听到这里，<br className="mobile-br"/>就想起了你<span className="heading-comma">。</span></h1><p className="heading-sub">留下一段音乐，送给此刻脑海里的那个人。</p></div><div className="heading-detail"><Heart size={20} strokeWidth={1.3}/><span>不用会音乐<br/>有想念就好</span></div></div>
      <div className="studio-grid" inert={!ready} aria-busy={!ready}>
        <section className="editor" aria-label="制作音乐明信片">
          <Tabs value={step} onValueChange={go} className="editor-tabs">
            <TabsList className="step-tabs"><TabsTrigger value="music" disabled={saving||audioBusy}><span>01</span>留一段音乐</TabsTrigger><TabsTrigger value="note" disabled={saving||audioBusy}><span>02</span>写一句心意</TabsTrigger><TabsTrigger value="send" disabled={saving||audioBusy}><span>03</span>寄出这一秒</TabsTrigger></TabsList>
            <TabsContent value="music" className="editor-panel">
              <div className="section-heading"><h2>哪段音乐，让你想到了 TA？</h2><span className="small-label">听歌就能上手</span></div>
              <p className="section-description">选一段现成的心意，或带来你们熟悉的那首歌。</p>
              {needsImport&&<p className="notice" role="status">上次的音乐文件需要重新导入，留言草稿已保留。</p>}
              <div className="music-sources"><div><Upload size={19}/><span><strong>带来你们的那首歌</strong><small>MP3 / WAV / M4A / OGG · 最长 5 分钟 · 20 MB 内</small></span></div><label className={`import-button ${audioBusy?'busy':''}`} htmlFor="music-file">{audioBusy?'正在准备…':'导入音乐'}<input className="sr-only" id="music-file" type="file" accept=".mp3,.wav,.m4a,.ogg" disabled={audioBusy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void selectFile(file);}}/></label></div>
              {(imported||draft.audio)&&<button className="library-toggle plain-button" aria-expanded={libraryOpen} aria-controls="original-library" onClick={()=>setLibraryOpen(value=>!value)}><Music2 size={15}/>{libraryOpen?'收起原创试听集':'也可以听听原创试听集'}</button>}
              <div id="original-library" hidden={!libraryOpen}><div className="mood-filters" aria-label="按心情挑选音乐">{['全部','想念','陪伴','感谢'].map(value=><button key={value} aria-pressed={mood===value} className={mood===value?'active':''} onClick={()=>setMood(value)}>{value==='全部'?'原创试听集':value}</button>)}</div>
              <div className="track-list">{shownTracks.map((track,index)=><button key={track.id} className={`track-choice ${draft.track===track.id?'selected':''}`} onClick={()=>chooseTrack(track.id)} aria-pressed={draft.track===track.id} disabled={audioBusy}><span className={`track-cover cover-${index}`}><img src="/coastal-dusk.png" alt=""/>{draft.track===track.id&&sound.playing?<span className="equalizer"><i/><i/><i/></span>:<Music2 size={18}/>}</span><span className="track-copy"><strong>{track.title}</strong><small>{track.subtitle}</small></span><span className="track-mood">{track.mood}</span><span className="track-play">{draft.track===track.id?<Check size={17}/>:<Play size={15}/>}</span></button>)}</div>
              </div>
              {imported&&<button className={`track-choice imported-track ${draft.track===imported.id?'selected':''}`} disabled={audioBusy} aria-pressed={draft.track===imported.id} onClick={()=>{player.current?.stop();edit({track:imported.id,audio:imported,start:imported.recommended,end:imported.recommended+Math.min(12,imported.duration)});}}><span className="track-cover"><Music2 size={20}/></span><span className="track-copy"><strong>{draft.track===imported.id?draft.audio?.title:imported.title}</strong><small>已导入 · {clock(imported.duration)} · 点击选择</small></span><span className="track-play">{draft.track===imported.id?<Check size={17}/>:<Play size={15}/>}</span></button>}
              {isLocal&&<div className="import-details"><div className="name-row"><label>歌名<Input value={draft.audio!.title} maxLength={80} onChange={e=>{const title=e.target.value;edit({audio:{...draft.audio!,title}});setImported(value=>value?{...value,title}:value);}}/></label><label>歌手（选填）<Input value={draft.audio!.artist} maxLength={60} placeholder="这首歌是谁唱的" onChange={e=>{const artist=e.target.value;edit({audio:{...draft.audio!,artist}});setImported(value=>value?{...value,artist}:value);}}/></label></div><label className="audio-permission"><input type="checkbox" checked={permission} onChange={e=>{setPermission(e.target.checked);setNotice('');}}/><span>我有权将这段音频用于明信片分享</span></label><p className="import-help">寄出时仅保存选中的 8—20 秒，整首歌留在你的设备上。</p></div>}
              <div className="music-console"><div className="console-top"><div><span className="playing-kicker">{sound.playing?'正在播放':'听听这一段'}</span><h3>{active.title}</h3></div><button className="round-play" aria-label={sound.playing?'暂停音乐':'播放音乐'} onClick={toggleFull} disabled={audioBusy}>{audioBusy?<Loader2 className="spin" size={20}/>:sound.playing?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}</button></div>
                <div className="waveform" aria-label="音乐波形与片段范围"><div className="clip-band" style={{left:`${draft.start/duration*100}%`,width:`${(draft.end-draft.start)/duration*100}%`}}/>{(wave.length?wave:Array(80).fill(.13)).map((v,i)=><i key={i} style={{height:`${Math.max(9,v*100)}%`}} className={i/80*duration>=draft.start&&i/80*duration<=draft.end?'in-range':''}/>)}<span className="playhead" style={{left:`${Math.min(99.8,(sound.track===draft.track?sound.position:0)/duration*100)}%`}}/></div>
                <Slider className="range-slider" value={[draft.start,draft.end]} min={0} max={duration} step={1} minStepsBetweenThumbs={8} onValueChange={changeRange} aria-label="选择音乐片段起止时间"/>
                <div className="time-row"><span>{clock(sound.track===draft.track?sound.position:0)} / {clock(duration)}</span><span>已选 <b>{clock(originalTime(draft,draft.start))}—{clock(originalTime(draft,draft.end))}</b> · {draft.end-draft.start} 秒</span></div>
                <div className="recommend-row"><button className="plain-button" onClick={useRecommendation}><Sparkles size={14}/>用推荐片段</button><span>不必找准拍子，喜欢就好</span></div><div className="clip-actions"><button className="capture-button" onClick={capture}><Heart size={15}/>留下这一秒</button><button className="plain-button" onClick={playClip} disabled={audioBusy}><Play size={13}/>试听选中片段</button></div>
              </div>
              <div className="step-bottom"><p>拖动两个端点，可选 8—20 秒。</p><button className="primary-button" disabled={audioBusy} onClick={()=>go('note')}>下一步，写给 TA<ArrowRight size={16}/></button></div>
            </TabsContent>
            <TabsContent value="note" className="editor-panel note-panel">
              <div className="section-heading"><h2>这段音乐，你想送给谁？</h2><Heart size={18}/></div><p className="section-description">一句平常的话，也可以被好好收藏。</p>
              <div className="name-row"><label>收信人的称呼<Input value={draft.toName} onChange={e=>edit({toName:e.target.value})} placeholder="比如：阿遥" maxLength={20} /></label><label>你的署名<Input value={draft.fromName} onChange={e=>edit({fromName:e.target.value})} placeholder="比如：小舟" maxLength={20}/></label></div>
              <label className="message-label" htmlFor="message">听到这里，我想对你说</label><Textarea id="message" className="message-input" value={draft.message} onChange={e=>edit({message:e.target.value})} maxLength={160} placeholder="听到这里，突然想起我们一起看过的那场日落。最近好吗？"/><div className="message-count">{draft.message.length} / 160</div>
              <div className="prompt-row"><span>不知道怎么开头？</span>{['突然想起我们…','这段时间辛苦啦。','有你在，真好。'].map(text=><button key={text} onClick={()=>edit({message:draft.message?`${draft.message}\n${text}`.slice(0,160):text})}>{text}</button>)}</div>
              <div className="theme-heading"><h3>给心意，选一种颜色</h3><span>同一场日落，不同的心情</span></div><RadioGroup className="theme-options" value={draft.theme} onValueChange={theme=>edit({theme:theme as CardInput['theme']})} aria-label="明信片颜色">{THEMES.map(theme=><label key={theme.id} htmlFor={`theme-${theme.id}`} className={draft.theme===theme.id?'chosen':''}><RadioGroupItem value={theme.id} id={`theme-${theme.id}`} /><span className="color-chip" style={{background:theme.color}}/>{theme.name}</label>)}</RadioGroup>
              <div className="step-bottom"><button className="plain-button" onClick={()=>go('music')}><ArrowLeft size={15}/>回去听听</button><button className="primary-button" onClick={()=>go('send')}>写好了，准备寄出<ArrowRight size={16}/></button></div>
            </TabsContent>
            <TabsContent value="send" className="editor-panel send-panel">
              <div className="section-heading"><h2>{saved?'这一秒，已经装进信里。':'心意准备好了。'}</h2><Send size={19}/></div><p className="section-description">{saved?'复制链接，发给你想到的那个人。':'对方打开时，会先听见你留下的这段音乐。'}</p>
              <div className="send-summary"><Music2 size={21}/><div><strong>{active.title}</strong><span>{clock(originalTime(draft,draft.start))}—{clock(originalTime(draft,draft.end))} · {draft.end-draft.start} 秒的心意</span></div><button className="plain-button" aria-label="试听寄出的片段" onClick={playClip}><Play size={17}/></button></div>
              <div className="delivery-note"><Mail size={27} strokeWidth={1.3}/><p>给 <strong>{draft.toName||'想到的你'}</strong><br/><span>{saved?'一张可以反复打开的音乐明信片。':'按住打开，音乐响起，心里话慢慢出现。'}</span></p></div>
              {!saved?<><button className="primary-button send-create" disabled={saving} onClick={create}>{saving?<Loader2 className="spin" size={17}/>:<Send size={17}/>} {saving?'正在装进信里…':'生成这张明信片'}</button><p className="privacy-note">卡片会保存。持有链接的人可以查看留言与回应。</p><button className="plain-button edit-again" disabled={saving} onClick={()=>go('note')}><ArrowLeft size={15}/>再改一下心里话</button></>:<><label className="share-label" htmlFor="share-url">明信片链接</label><div className="share-field"><Input id="share-url" value={url} readOnly onFocus={e=>e.target.select()}/><button className="copy-button" onClick={copy}>{copied?<CheckCheck size={17}/>:<Copy size={17}/>} {copied?'已复制':'复制'}</button></div><a className="recipient-link" href={url} target="_blank" rel="noreferrer">打开收信页面<ExternalLink size={15}/></a><div className="responses"><div className="response-heading"><h3>收到的回应</h3><button className="plain-button" disabled={refreshing} onClick={refresh}><RefreshCw size={14} className={refreshing?'spin':''}/>刷新</button></div>{replies.length?replies.map(r=><div className="mini-reply" key={r.id}><strong>{r.name} · {r.reaction}</strong>{r.message&&<p>{r.message}</p>}</div>):<p className="empty-replies">回应会留在这里。不着急，心意正在路上。</p>}</div><p className="privacy-note">分享前请确认站点允许对方访问。链接内的留言与回应仅向有访问权限的人展示。</p></>}
            </TabsContent>
          </Tabs>
          {notice&&<p className="notice" role="status">{notice}</p>}
          <div className="editor-foot"><span><Headphones size={14}/>戴上耳机，让这一刻更近一点</span><label><Volume2 size={15}/><span className="sr-only">音量</span><Slider className="volume-slider" aria-label="音量" value={[volume]} min={0} max={100} step={1} onValueChange={([value])=>{setVolume(value);player.current?.setVolume(value/100);}}/></label></div>
        </section>
        <aside className="preview-column" aria-label="明信片实时预览"><div className="preview-caption"><span>你的音乐明信片</span><span>LIVE PREVIEW</span></div><Postcard card={previewCard} playing={sound.playing} onPlay={playClip}/><button className="preview-link" onClick={()=>{player.current?.pause();setPreview(true);}}><Sparkles size={15}/>看看 TA 收到的样子<ArrowRight size={14}/></button><p className="preview-whisper">有些心意，适合用一首歌说。</p></aside>
      </div>
    </main>
    <footer className="site-footer"><span>这一秒，想到你<span className="footer-dot">·</span>让音乐替心意走近一点</span><span>带上一首歌 · 留下一份心意</span></footer>
    <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="preview-dialog"><DialogTitle>TA 收到的样子</DialogTitle><DialogDescription>这是预览，不会保存或发送。</DialogDescription>{preview&&<ListenCard card={previewCard}/>}</DialogContent></Dialog>
  </div>;
}
