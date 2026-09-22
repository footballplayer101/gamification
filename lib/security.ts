import { createHmac, timingSafeEqual, scryptSync } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
export const ADMIN_COOKIE = 'apr_admin';
export function configured() { return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET?.length ?? 0)>=32 && process.env.DATABASE_URL); }
function signature(v:string) { return createHmac('sha256',process.env.SESSION_SECRET!).update(v).digest('base64url'); }
function equal(a:string,b:string) { const x=Buffer.from(a),y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); }
export function passwordMatches(password:string) {
  const [salt,hash] = (process.env.ADMIN_PASSWORD_HASH ?? '').split(':');
  if (!salt || !hash || password.length>256) return false;
  return equal(scryptSync(password,salt,64).toString('hex'),hash);
}
export function makeSession() {
  const body = Buffer.from(JSON.stringify({email:process.env.ADMIN_EMAIL!.toLowerCase(),exp:Date.now()+8*60*60*1000})).toString('base64url');
  return `${body}.${signature(body)}`;
}
export async function isAdmin() {
  if (!configured()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {const [body,sig] = token.split('.'); if (!equal(signature(body),sig ?? '')) return false; const claims=JSON.parse(Buffer.from(body,'base64url').toString()); return claims.email===process.env.ADMIN_EMAIL!.toLowerCase() && claims.exp>Date.now();} catch {return false;}
}
export function sameOrigin(request:Request) {
  const origin=request.headers.get('origin');
  if (!origin) return false;
  if (process.env.APP_ORIGIN) return origin===process.env.APP_ORIGIN;
  // Next.js may expose an internal localhost origin in request.url.
  // Match the browser Origin to the actual request Host; reject cross-origin requests.
  try {
    const supplied=new URL(origin);
    const host=request.headers.get('host');
    return supplied.host===host && (supplied.protocol==='https:' || (!process.env.VERCEL && supplied.protocol==='http:'));
  } catch { return false; }
}
export async function limit(request:Request,scope:string,maximum:number) {
  // Vercel overwrites x-vercel-forwarded-for. Never trust arbitrary client forwarded headers.
  const ip = process.env.VERCEL ? (request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown') : 'local';
  const key=createHmac('sha256',process.env.SESSION_SECRET!).update(`${scope}:${ip}`).digest('hex');
  const bucket=Math.floor(Date.now()/60000);
  const sql=db();
  const rows=await sql`INSERT INTO request_limits (key,bucket,hits) VALUES (${key},${bucket},1) ON CONFLICT (key) DO UPDATE SET bucket=EXCLUDED.bucket,hits=CASE WHEN request_limits.bucket=EXCLUDED.bucket THEN request_limits.hits+1 ELSE 1 END RETURNING hits`;
  return rows[0].hits<=maximum;
}
export function json(data:unknown,status=200) {return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export function unavailable() {return json({error:'현재 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.'},503);}
