'use client';
import {useEffect,useRef} from 'react';
type Registry={registerTool:(tool:unknown,options?:{signal:AbortSignal})=>unknown};
export function useDraftTool(state:Record<string,unknown>){
  const latest=useRef(state);latest.current=state;
  useEffect(()=>{
    const registry=(document as Document&{modelContext?:Registry}).modelContext;if(!registry?.registerTool)return;
    const lifecycle=new AbortController();
    try{Promise.resolve(registry.registerTool({name:'read_music_card_draft',title:'查看音乐明信片草稿',description:'Read the currently selected music, clip, message and save status. Does not play, save, publish or send anything.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input:unknown){if(input!==undefined&&(input===null||typeof input!=='object'||Object.keys(input).length))throw new Error('This tool takes an empty object.');return {...latest.current};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
}
