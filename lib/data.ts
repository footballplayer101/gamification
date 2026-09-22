import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { db, demoMode, localReportMode } from './db';
import { parseCSV } from './import';
import { rankLearners } from './rules';
export const DEMO_EMAIL = 'learner@apr-demo.example';
export function aliasFor(email:string) {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET_NOT_CONFIGURED');
  return '플레이어 ' + createHmac('sha256',process.env.SESSION_SECRET).update(email).digest('hex').slice(0,12).toUpperCase();
}
export async function snapshot() {
  if (localReportMode()) {
    const path=process.env.LOCAL_REPORT_PATH;
    if (!path) throw new Error('LOCAL_REPORT_PATH_NOT_CONFIGURED');
    const report=parseCSV(await readFile(path,'utf8'));
    if (report.errors.length) throw new Error('LOCAL_REPORT_INVALID');
    const dates=path.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/);
    return {demo:false,reportTest:true,reportStart:dates?.[1]??null,asOf:dates?.[2]??null,updatedAt:null,recommendedUrl:'',learners:rankLearners(report.rows.map(row=>({...row,alias:aliasFor(row.email)})))};
  }
  if (demoMode()) return {
    demo:true, asOf:'2026-10-12', updatedAt:null, recommendedUrl:'',
    learners:rankLearners([180,143.5,120,98,75,60,45.5,32,15,8].map((minutes,i)=>({email:i===4?DEMO_EMAIL:`demo${i+1}@apr-demo.example`,minutes,alias:`플레이어 ${String(i+1).padStart(4,'0')}`})))
  };
  const sql = db();
  const records = await sql`SELECT as_of, updated_at, recommended_url, learners FROM event_state WHERE id=1`;
  const s = records[0];
  return {demo:false, asOf:s?.as_of ?? null, updatedAt:s?.updated_at ?? null, recommendedUrl:s?.recommended_url ?? '', learners:rankLearners((s?.learners ?? []) as {email:string; minutes:number; alias:string}[])};
}
export const publicLearner = ({email:_,...rest}:Awaited<ReturnType<typeof snapshot>>['learners'][number])=>rest;
