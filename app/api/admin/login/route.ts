import {cookies} from 'next/headers';
import {ADMIN_COOKIE,configured,passwordMatches,makeSession,sameOrigin,limit,json,unavailable} from '@/lib/security';
export async function POST(request:Request){
  if(!sameOrigin(request)) return json({error:'허용되지 않은 요청입니다.'},403);
  if(!configured()) return json({error:'관리자 계정과 데이터베이스 설정이 필요합니다.'},503);
  try{
    if(!(await limit(request,'login',5))) return json({error:'로그인 시도가 많습니다. 1분 후 다시 시도해 주세요.'},429);
    const body=await request.json();
    const pass=passwordMatches(String(body.password??''));
    if(String(body.email??'').trim().toLowerCase()!==process.env.ADMIN_EMAIL!.toLowerCase() || !pass) return json({error:'이메일 또는 비밀번호를 확인해 주세요.'},401);
    (await cookies()).set(ADMIN_COOKIE,makeSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:28800});
    return json({ok:true});
  }catch{return unavailable();}
}
