import {isAdmin,json,unavailable} from '@/lib/security';
import {snapshot} from '@/lib/data';
export const dynamic='force-dynamic';
export async function GET(){if(!(await isAdmin()))return json({error:'관리자 로그인이 필요합니다.'},401);try{return json(await snapshot());}catch{return unavailable();}}
