import Receiver from '@/app/receiver';
export default async function CardPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Receiver id={id}/>;}
