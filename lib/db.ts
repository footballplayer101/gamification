import postgres from 'postgres';
let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_NOT_CONFIGURED');
  return connection ??= postgres(url,{max:3,idle_timeout:20,connect_timeout:10,prepare:false});
}
export const demoMode = () => process.env.DEMO_MODE === 'true';
// Explicitly local-only: never enable private report fixtures on Vercel.
export const localReportMode = () => !process.env.VERCEL && process.env.LOCAL_REPORT_MODE === 'true';
