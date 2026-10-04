import {env} from 'cloudflare:workers';
export function rawDb(){if(!env.DB)throw new Error('Card storage unavailable');return env.DB;}
export const cardColumns='id, track, clip_start AS start, clip_end AS end, message, to_name AS toName, from_name AS fromName, theme, created_at AS createdAt, parent_card_id AS parentCardId, thread_id AS threadId';
export const replyColumns='id, name, reaction, message, created_at AS createdAt';
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
export const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export async function body(request:Request){
  if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('请从本站提交明信片。');
  if(!request.headers.get('content-type')?.includes('application/json'))throw new Error('请求格式不正确。');
  if(Number(request.headers.get('content-length'))>8192)throw new Error('内容太长，请缩短后再试。');
  const value=await request.text();if(value.length>8192)throw new Error('内容太长，请缩短后再试。');
  try{return JSON.parse(value);}catch{throw new Error('请求格式不正确。');}
}
