import {rawDb} from './raw';
import type {AudioMeta,Card,Conversation} from '@/lib/moment';

// Root cards (including cards created before music replies) keep a NULL thread_id.
// Every reply references the root directly, so reading a thread needs no recursion.
export async function readConversation(card:Card,before:string|null):Promise<Conversation|null>{
  const db=rawDb(),rootId=card.threadId||card.id;
  let cursor:{id:string;createdAt:number}|null=null;
  if(before){cursor=await db.prepare('SELECT id,created_at AS createdAt FROM moment_cards WHERE id = ? AND (id = ? OR thread_id = ?)').bind(before,rootId,rootId).first();if(!cursor)return null;}
  const query=db.prepare(`SELECT c.id,c.track,c.clip_start AS start,c.clip_end AS end,c.message,
    c.to_name AS toName,c.from_name AS fromName,c.theme,c.created_at AS createdAt,
    c.parent_card_id AS parentCardId,c.thread_id AS threadId,
    a.title AS audioTitle,a.artist AS audioArtist,a.duration AS audioDuration,a.source_start AS audioStart
    FROM moment_cards c LEFT JOIN moment_audio a ON a.id = c.track
    WHERE (c.id = ? OR c.thread_id = ?) ${cursor?'AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))':''}
    ORDER BY c.created_at DESC,c.id DESC LIMIT 21`);
  const {results}=await (cursor?query.bind(rootId,rootId,cursor.createdAt,cursor.createdAt,cursor.id):query.bind(rootId,rootId)).all<Card&{audioTitle:string|null;audioArtist:string|null;audioDuration:number|null;audioStart:number|null}>();
  const hasMore=results.length>20;
  const cards=results.slice(0,20).map(row=>{
    const {audioTitle,audioArtist,audioDuration,audioStart,...entry}=row;
    const audio:AudioMeta|undefined=audioTitle&&audioDuration!=null?{id:row.track,title:audioTitle,artist:audioArtist||'',duration:audioDuration,sourceStart:audioStart||0}:undefined;
    return {...entry,...(audio?{audio}:{})};
  }).reverse();
  return {rootId,cards,olderCursor:hasMore?cards[0].id:null};
}
