export const EVENT = { name: 'APR, 나혼자만 레벨업', start: '2026-10-06', end: '2026-10-30' };
export const REWARDS = [
  { level: 1, min: 15, title: '스타벅스 아메리카노 쿠폰', detail: '', count: 10, range: '15분 이상 · 60분 미만' },
  { level: 2, min: 60, title: '배달의민족 3만원 기프티콘', detail: '', count: 4, range: '60분 이상 · 120분 미만' },
  { level: 3, min: 120, title: '메디큐브 부스터 글로우', detail: '디바이스', count: 2, range: '120분 이상' }
];
export type Learner = { email: string; minutes: number; alias: string; rank: number; level: number };
export function levelOf(minutes: number) { return minutes >= 120 ? 3 : minutes >= 60 ? 2 : minutes >= 15 ? 1 : 0; }
export function eligible(minutes: number) { return minutes >= 15; }
export function progression(minutes: number) {
  const target = minutes < 15 ? 15 : minutes < 60 ? 60 : 120;
  const base = minutes < 15 ? 0 : minutes < 60 ? 15 : 60;
  return { target, remaining: Math.max(0, Math.ceil((target - minutes) * 100) / 100), percent: Math.min(100, Math.max(0, (minutes - base) / (target - base) * 100)) };
}
export function rankLearners(rows: {email: string; minutes: number; alias: string}[]): Learner[] {
  const sorted = [...rows].sort((a,b) => b.minutes - a.minutes || a.alias.localeCompare(b.alias));
  let rank = 0;
  return sorted.map((row, i) => { if (i === 0 || row.minutes !== sorted[i-1].minutes) rank = i + 1; return { ...row, rank, level: levelOf(row.minutes) }; });
}
export function formatMinutes(n: number) { return `${Number(n.toFixed(2)).toLocaleString('ko-KR')}분`; }
export function normalizeEmail(v: string) { return v.trim().toLowerCase(); }
export function validEmail(v: string) { return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
