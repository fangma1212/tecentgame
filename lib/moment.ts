export const TRACKS = [
  {id:'sunset',title:'把黄昏留给你',subtitle:'轻柔钢琴 · 像那天没说完的话',mood:'想念',duration:48,tones:[60,64,67,71]},
  {id:'rain',title:'雨停之前',subtitle:'玻璃琴音 · 陪你安静一会儿',mood:'陪伴',duration:48,tones:[57,60,64,67]},
  {id:'home',title:'慢慢走回家',subtitle:'温暖拨弦 · 平凡日子的好心情',mood:'感谢',duration:48,tones:[65,69,72,76]},
] as const;
export const THEMES=[{id:'sunset',name:'日落来信',color:'#b54730'},{id:'ocean',name:'海风作伴',color:'#426a78'},{id:'night',name:'夜色私语',color:'#665274'}] as const;
export const REACTIONS=['听到了','也想你','抱抱你','谢谢你'] as const;
export type TrackId=string;
export type AudioMeta={id:string;title:string;artist:string;duration:number;sourceStart:number};
export type ThemeId=typeof THEMES[number]['id'];
export type CardInput={track:TrackId;start:number;end:number;message:string;toName:string;fromName:string;theme:ThemeId;audio?:AudioMeta};
export type Card=CardInput&{id:string;createdAt:number;parentCardId?:string|null;threadId?:string|null};
export type Conversation={rootId:string;cards:Card[];olderCursor:string|null};
export type Reply={id:string;name:string;reaction:string;message:string;createdAt:number};
export const DEFAULT_DRAFT:CardInput={track:'sunset',start:12,end:24,message:'',toName:'',fromName:'',theme:'sunset'};
export const SAMPLE_CARD:Card={id:'sample',track:'sunset',start:12,end:24,message:'听到这里，突然想起我们一起看过的那场日落。\n最近好吗？有空再一起去看海吧。',toName:'阿遥',fromName:'小舟',theme:'sunset',createdAt:0};
export function clock(seconds:number){return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;}
export function trackInfo(card:CardInput){return TRACKS.find(t=>t.id===card.track)??{id:card.track,title:card.audio?.title||'我的音乐',subtitle:card.audio?.artist||'自己挑选的音乐',duration:card.audio?.duration||48,mood:'我的音乐'};}
export function originalTime(card:CardInput,time:number){return time+(card.audio?.sourceStart||0);}
export function validateCard(value:unknown):CardInput{
  if(!value||typeof value!=='object')throw new Error('请填写完整的明信片。');
  const v=value as Record<string,unknown>;
  const audio=v.audio as AudioMeta|undefined;
  const builtin=TRACKS.some(t=>t.id===v.track);
  if((!builtin&&(!audio||audio.id!==v.track||typeof audio.title!=='string'||!audio.title.trim()||audio.title.length>80||typeof audio.artist!=='string'||audio.artist.length>60||!Number.isInteger(audio.duration)||audio.duration<8||audio.duration>300||!Number.isInteger(audio.sourceStart)||audio.sourceStart<0||audio.sourceStart>300))||!THEMES.some(t=>t.id===v.theme))throw new Error('请选择音乐和卡片样式。');
  const duration=builtin?48:audio!.duration;
  if(typeof v.start!=='number'||typeof v.end!=='number'||!Number.isInteger(v.start)||!Number.isInteger(v.end)||v.start<0||v.end>duration||v.end-v.start<8||v.end-v.start>20)throw new Error('请选择 8—20 秒的音乐片段。');
  if(typeof v.message!=='string'||!v.message.trim()||v.message.trim().length>160)throw new Error('请写下 1—160 字的留言。');
  for(const key of ['toName','fromName'])if(typeof v[key]!=='string'||(v[key] as string).trim().length>20)throw new Error('称呼请控制在 20 字以内。');
  return {track:v.track as TrackId,theme:v.theme as ThemeId,start:v.start,end:v.end,message:v.message.trim(),toName:(v.toName as string).trim()||'想到的你',fromName:(v.fromName as string).trim()||'一个想你的人',...(!builtin?{audio}: {})};
}
