import {env} from 'cloudflare:workers';
import {rawDb} from './raw';
import {TRACKS,type AudioMeta} from '@/lib/moment';
export function bucket(){if(!env.BUCKET)throw new Error('Audio storage unavailable');return env.BUCKET;}
export async function audioMetadata(id:string){return rawDb().prepare('SELECT id,title,artist,duration,source_start AS sourceStart FROM moment_audio WHERE id = ?').bind(id).first<AudioMeta>();}
export async function withAudio<T extends {track:string}>(card:T){
  if(TRACKS.some(t=>t.id===card.track))return card;
  const audio=await audioMetadata(card.track);if(!audio)throw new Error('Audio metadata unavailable');return {...card,audio};
}
