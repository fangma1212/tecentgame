'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Heart,Music2,Send,Loader2,RefreshCw} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {REACTIONS,SAMPLE_CARD,type Card,type Reply,type Conversation} from '@/lib/moment';
import {Brand} from './studio';
import {ListenCard} from './visuals';
import {ConversationTrail} from './conversation-trail';
type ApiResult={card:Card;replies:Reply[];reply:Reply;conversation:Conversation;error?:string};

export default function Receiver({id}:{id:string}){
  const sample=id==='sample';
  const [card,setCard]=useState<Card|null>(sample?SAMPLE_CARD:null),[replies,setReplies]=useState<Reply[]>([]),[conversation,setConversation]=useState<Conversation|null>(null);
  const [loading,setLoading]=useState(!sample),[error,setError]=useState(''),[opened,setOpened]=useState(false),[refreshing,setRefreshing]=useState(false);
  const [reaction,setReaction]=useState('听到了'),[name,setName]=useState(''),[message,setMessage]=useState(''),[sending,setSending]=useState(false),[submitted,setSubmitted]=useState(false),[replyStatus,setReplyStatus]=useState('');
  const key=useRef<string|null>(null);
  const load=useCallback(async(signal?:AbortSignal)=>{
    if(sample)return;
    try{const r=await fetch(`/api/cards/${id}`,{signal});const data=await r.json() as ApiResult;if(!r.ok)throw new Error(data.error||'暂时没能打开这张明信片。');if(signal?.aborted)return;setCard(data.card);setReplies(data.replies);setConversation(data.conversation);setError('');}
    catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'暂时无法连接，请稍后重试。');}finally{if(!signal?.aborted)setLoading(false);}
  },[id,sample]);
  useEffect(()=>{const abort=new AbortController();void load(abort.signal);return()=>abort.abort();},[load]);
  async function refresh(){
    setRefreshing(true);setReplyStatus('');
    try{const response=await fetch(`/api/cards/${id}`);const result=await response.json() as ApiResult;if(!response.ok)throw new Error(result.error);setReplies(result.replies);setConversation(result.conversation);setReplyStatus('音乐往来已更新。');}
    catch{setReplyStatus('暂时没能更新，已打开的信还在，请稍后重试。');}finally{setRefreshing(false);}
  }
  async function send(){
    setSending(true);setReplyStatus('');key.current??=crypto.randomUUID();
    try{
      if(sample){setSubmitted(true);setReplyStatus('已体验回应。示例卡片不会把内容寄给任何人。');return;}
      const r=await fetch(`/api/cards/${id}/replies`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestKey:key.current,name,reaction,message})});const data=await r.json() as ApiResult;
      if(!r.ok)throw new Error(data.error||'暂时没能送出回应，请重试。');setReplies(old=>old.some(x=>x.id===data.reply.id)?old:[...old,data.reply]);setSubmitted(true);setReplyStatus('回应已留下。寄信人打开这张卡片就能看到。');
    }catch(e){setReplyStatus(e instanceof Error?e.message:'网络暂时中断，请重试。');}finally{setSending(false);}
  }
  const edit=()=>{key.current=null;setReplyStatus('');};
  return <div className="app-shell receiver-shell">
    <header className="site-header"><Brand/><a className="quiet-link" href="/"><ArrowLeft size={16}/>我也写一张</a></header>
    <main className="receiver-main">
      {sample&&<p className="sample-notice">体验来信 · 这是一张示例明信片</p>}
      {loading?<div className="loading-card"><Loader2 className="spin" size={26}/><p>有一份心意，正在靠近。</p></div>:error?<div className="loading-card"><Heart size={30}/><h1>这封信暂时没有打开</h1><p role="alert">{error}</p><button className="primary-button" onClick={()=>{setLoading(true);void load();}}><RefreshCw size={16}/>重新试试</button></div>:card?<>
        <div className="receiver-intro"><span className="eyebrow">A MOMENT, JUST FOR YOU</span><p>{opened?'愿你听见，音乐里的那句想念。':'不用猜，不用答对。听见这份心意就好。'}</p></div>
        <ListenCard key={card.id} card={card} onOpened={()=>setOpened(true)}/>
        {opened&&<>
          <section className="music-reply-invite" aria-label="用音乐回信">
            <span className="music-reply-icon"><Music2 size={24}/></span><div><span className="eyebrow">LET THE MUSIC ANSWER</span><h2>你想到的那段音乐，也寄给 TA 吧。</h2><p>{sample?'选一段音乐，开始属于你们的往来。':'不用唱，也不用创作。听到哪一段，就回哪一段。'}</p></div>
            <a className="primary-button" href={sample?'/':`/reply/${id}`}><Music2 size={16}/>{sample?'制作我的音乐明信片':'用一段音乐回信'}<ArrowRight size={15}/></a>
          </section>
          {!sample&&conversation&&<ConversationTrail key={`${conversation.rootId}-${conversation.cards.at(-1)?.id}-${conversation.olderCursor}`} conversation={conversation} currentId={id} onRefresh={refresh} refreshing={refreshing}/>}
          <section className="reply-section" aria-label="留下回应">
            <div className="section-heading"><h2>{submitted?'你的心意，也被留下了。':'也可以，先回一句话。'}</h2><Heart size={18}/></div>
            {!submitted?<>
              <p className="section-description">{sample?'试着回应一下，示例内容不会寄出。':'一句简短的回应，就能让心意有回声。'}</p>
              <fieldset disabled={sending}>
                <RadioGroup className="reaction-options" value={reaction} onValueChange={v=>{setReaction(v);edit();}} aria-label="回应心情">{REACTIONS.map((r,i)=><label key={r} htmlFor={`reaction-${i}`} className={reaction===r?'chosen':''}><RadioGroupItem id={`reaction-${i}`} value={r}/><span>{['♪','♡','☁','✧'][i]}</span>{r}</label>)}</RadioGroup>
                <label className="message-label" htmlFor="reply-name">你的称呼 <small>选填</small></label><Input id="reply-name" value={name} maxLength={20} onChange={e=>{setName(e.target.value);edit();}} placeholder={card.toName}/>
                <label className="message-label" htmlFor="reply-message">再留一句话 <small>选填</small></label><Textarea id="reply-message" value={message} maxLength={120} onChange={e=>{setMessage(e.target.value);edit();}} placeholder="我也想起了那个时候。"/>
                <div className="reply-actions"><span>{message.length} / 120</span><button className="primary-button" onClick={send}>{sending?<Loader2 className="spin" size={16}/>:<Send size={16}/>} {sample?'体验回应':'把回应留给 TA'}</button></div>
              </fieldset><p className="privacy-note">{sample?'这里的回应仅供体验。':'回应会显示在这张卡片里，有访问权限的人可以看到。'}</p>
            </>:<div className="reply-success"><Heart size={26}/><p>{reaction}{message&&` · ${message}`}</p></div>}
            {!sample&&replies.length>0&&<div className="received-responses"><h3>留在这张卡片里的回声</h3>{replies.map(r=><div className="mini-reply" key={r.id}><strong>{r.name} · {r.reaction}</strong>{r.message&&<p>{r.message}</p>}</div>)}</div>}
          </section>
          {replyStatus&&<p className="notice" role="status">{replyStatus}</p>}
        </>}
        <a className="make-your-own" href="/">我也有一段音乐，想送给一个人<ArrowRight size={16}/></a>
      </>:null}
    </main><footer className="site-footer"><span>这一秒，想到你</span><span>有些话，音乐会替你记得。</span></footer>
  </div>;
}
