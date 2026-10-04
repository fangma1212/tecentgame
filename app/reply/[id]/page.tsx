import MomentStudio from '@/app/studio';
export default async function MusicReplyPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <MomentStudio key={id} replyTo={id}/>;}
