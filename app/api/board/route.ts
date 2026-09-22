import {snapshot,publicLearner} from '@/lib/data';
import {json,unavailable} from '@/lib/security';
export const dynamic='force-dynamic';
export async function GET(){try{const s=await snapshot(); return json({...s,learners:s.learners.map(publicLearner)});}catch{return unavailable();}}
