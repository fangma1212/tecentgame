'use client';
import {useState} from 'react';
import {ArrowUpRight,Headphones,Loader2,Mail,Music2,RefreshCw} from 'lucide-react';
import {trackInfo,type Card,type Conversation} from '@/lib/moment';

export function ConversationTrail({conversation,currentId,onRefresh,refreshing=false}:{conversation:Conversation;currentId:string;onRefresh:()=>void;refreshing?:boolean}){
  const [older,setOlder]=useState<Card[]>([]),[cursor,setCursor]=useState(conversation.olderCursor),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const cards=[...older,...conversation.cards];
  async function loadOlder(){
    if(!cursor||loading)return;setLoading(true);setError('');
    try{const response=await fetch(`/api/cards/${currentId}?before=${cursor}`);const result=await response.json() as {conversation:Conversation;error?:string};if(!response.ok)throw new Error(result.error||'暂时无法读取往来。');const previous=result.conversation;setOlder(current=>[...previous.cards,...current]);setCursor(previous.olderCursor);}
    catch{setError('之前的往来暂时没能打开，请再试一次。');}finally{setLoading(false);}
  }
  return <section className="conversation-section" aria-label="音乐往来">
    <div className="response-heading"><h3><Mail size={18}/>把心意，一封一封留下</h3><button className="plain-button" disabled={refreshing} onClick={onRefresh}><RefreshCw size={14} className={refreshing?'spin':''}/>刷新往来</button></div>
    <p className="conversation-subtitle">{cards.length===1?'第一封已经在这里，下一段音乐可以是回信。':'从你的这一秒，到我的这一秒。每一封都可以再打开听。'}</p>
    {cursor&&<button className="plain-button older-moments" disabled={loading} onClick={loadOlder}>{loading?<Loader2 className="spin" size={14}/>:<Headphones size={14}/>}查看更早的往来</button>}
    <ol className="conversation-list">{cards.map(entry=><li key={entry.id} className={entry.id===currentId?'current-moment':''}>
      <span className="conversation-dot"><Music2 size={14}/></span>
      <a href={`/card/${entry.id}`} aria-current={entry.id===currentId?'page':undefined}>
        <span className="moment-route"><strong>{entry.fromName}</strong><span>寄给</span><strong>{entry.toName}</strong><small>{entry.id===currentId?'正在读':entry.parentCardId?'音乐回信':'第一封'}</small></span>
        <span className="moment-song">{trackInfo(entry).title}<span> · {entry.end-entry.start} 秒</span><ArrowUpRight size={14}/></span>
        <p>{entry.message}</p>
        <time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time>
      </a>
    </li>)}</ol>
    {error&&<p className="notice" role="status">{error}</p>}
    <p className="privacy-note">持有其中任一明信片链接、且有站点访问权限的人，可以查看这段音乐往来。</p>
  </section>;
}
