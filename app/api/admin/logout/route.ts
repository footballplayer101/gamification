import {cookies} from 'next/headers';
import {ADMIN_COOKIE,sameOrigin,json} from '@/lib/security';
export async function POST(r:Request){if(!sameOrigin(r))return json({error:'허용되지 않은 요청입니다.'},403);(await cookies()).delete(ADMIN_COOKIE);return json({ok:true});}
