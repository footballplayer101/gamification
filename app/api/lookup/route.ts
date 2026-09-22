import {snapshot,publicLearner} from '@/lib/data';
import {json,limit,sameOrigin,unavailable} from '@/lib/security';
import {normalizeEmail,validEmail} from '@/lib/rules';
import {demoMode,localReportMode} from '@/lib/db';
export async function POST(request:Request){
  if(!sameOrigin(request)) return json({error:'허용되지 않은 요청입니다.'},403);
  try {
    if(Number(request.headers.get('content-length')||0)>2048) return json({error:'요청이 너무 큽니다.'},413);
    const body=await request.json(); const email=normalizeEmail(String(body.email??''));
    if(!validEmail(email)) return json({error:'올바른 이메일 주소를 입력해 주세요.'},400);
    if(!demoMode() && !localReportMode() && !(await limit(request,'lookup',30))) return json({error:'조회가 많습니다. 1분 후 다시 시도해 주세요.'},429);
    const s=await snapshot(); const me=s.learners.find(v=>v.email===email);
    if(!me) return json({error:'조회된 기록이 없습니다. Udemy 로그인 이메일과 데이터 기준일을 확인해 주세요.'},404);
    return json({learner:publicLearner(me),asOf:s.asOf,demo:s.demo});
  }catch{return unavailable();}
}
