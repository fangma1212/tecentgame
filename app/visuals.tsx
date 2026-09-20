'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Music2,Play,Pause,Heart,ArrowRight,Volume2} from 'lucide-react';
import {SoundPlayer} from '@/lib/sound';
import {TRACKS,clock,type Card} from '@/lib/moment';

export function Postcard({card,playing=false,onPlay}:{card:Card;playing?:boolean;onPlay?:()=>void}){
  const track=TRACKS.find(t=>t.id===card.track)!;
  return <article className={`postcard theme-${card.theme}`}><div className="postcard-photo"><img src="/coastal-dusk.png" alt="夕阳照在海面上，一条安静的公路沿海延伸"/><div className="photo-vignette"/><span className="photo-tag">A MOMENT FOR YOU</span><div className="photo-title"><span>把这一秒，</span><span>寄给你。</span></div><span className="photo-time">{clock(card.start)} <i>—</i> {clock(card.end)}</span></div><div className="postcard-paper"><div className="paper-to"><span>TO.</span><strong>{card.toName}</strong><Heart size={17} strokeWidth={1.3}/></div><p className="paper-message">{card.message}</p><div className="paper-from">From <span>{card.fromName}</span></div><div className="postcard-song"><span className="song-mark"><Music2 size={18}/></span><div><strong>{track.title}</strong><small>{card.end-card.start} 秒 · 只想让你听见</small></div>{onPlay?<button onClick={onPlay} aria-label={playing?'重新试听片段':'试听明信片音乐'}><Play size={15} fill="currentColor"/></button>:<Heart size={15}/>}</div></div></article>;
}

export function ListenCard({card,onOpened}:{card:Card;onOpened?:()=>void}){
  const [ready,setReady]=useState(false);
  const [opened,setOpened]=useState(false),[holding,setHolding]=useState(false),[progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState('');
  const engine=useRef<SoundPlayer|null>(null),hold=useRef<ReturnType<typeof setInterval>|null>(null),openedRef=useRef(false),opening=useRef(false);
  useEffect(()=>{const p=new SoundPlayer(s=>setPlaying(s.playing));engine.current=p;setReady(true);const pause=()=>{if(document.hidden)p.pause();};document.addEventListener('visibilitychange',pause);return()=>{if(hold.current)clearInterval(hold.current);p.close();document.removeEventListener('visibilitychange',pause);};},[]);
  async function reveal(){if(openedRef.current||opening.current)return;opening.current=true;if(hold.current)clearInterval(hold.current);setHolding(false);setProgress(1);setOpened(true);openedRef.current=true;onOpened?.();try{await engine.current!.play(card.track,card.start,card.end);}catch{setError('音乐暂时没响起，点击下方播放再试一次。');}finally{opening.current=false;}}
  function begin(){if(openedRef.current)return;setHolding(true);setProgress(0);setError('');engine.current?.init().catch(()=>{});const start=performance.now();if(hold.current)clearInterval(hold.current);hold.current=setInterval(()=>{const p=Math.min(1,(performance.now()-start)/900);setProgress(p);if(p>=1)reveal();},16);}
  function cancel(){if(hold.current)clearInterval(hold.current);setHolding(false);if(!openedRef.current)setProgress(0);}
  async function toggle(){try{if(playing)engine.current?.pause();else await engine.current?.play(card.track,card.start,card.end);}catch{setError('声音未能启动，请再点一次播放。');}}
  return <div className={`listening-card ${opened?'opened':''}`} inert={!ready} aria-busy={!ready}><Postcard card={card}/>{!opened&&<div className="sealed-layer"><span className="sealed-kicker">有一段音乐，专门留给你</span><h2>{card.toName}，<br/>有人在这一秒想到了你。</h2><p>来自 {card.fromName} 的音乐明信片</p><button className={`hold-button ${holding?'holding':''}`} style={{'--hold-progress':`${progress*100}%`} as CSSProperties} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);begin();}} onPointerUp={cancel} onPointerCancel={cancel} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();reveal();}}} aria-label="按住打开音乐明信片，也可以按 Enter 打开"><Heart size={18}/><span>{holding?'心意正在靠近…':'按住，听见这份心意'}</span></button><button className="direct-open" onClick={reveal}>也可以直接打开<ArrowRight size={13}/></button><span className="sealed-duration">一小段音乐，{card.end-card.start} 秒的想念</span></div>}{opened&&<div className="received-player"><button className="primary-button" onClick={toggle}>{playing?<Pause size={16}/>:<Play size={16}/>} {playing?'暂停音乐':'再听一遍'}</button><span><Volume2 size={14}/>{clock(card.start)}—{clock(card.end)}</span></div>}{error&&<p role="status" className="notice">{error}</p>}</div>;
}
