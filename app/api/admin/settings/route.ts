import {db,demoMode} from '@/lib/db';
import {isAdmin,sameOrigin,json,unavailable} from '@/lib/security';
export async function POST(r:Request){
  if(!sameOrigin(r)||!(await isAdmin()))return json({error:'관리자 로그인이 필요합니다.'},401);
  if(demoMode())return json({error:'미리보기 모드에서는 저장할 수 없습니다.'},409);
  try {const {url}=await r.json();if(typeof url!=='string'||url.length>2000)return json({error:'링크를 확인하세요.'},400);
    if(url && new URL(url).protocol!=='https:')return json({error:'https 링크만 사용할 수 있습니다.'},400);
    const sql=db();await sql`UPDATE event_state SET recommended_url=${url} WHERE id=1`;return json({ok:true});
  }catch{return unavailable();}
}
