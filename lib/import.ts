import Papa from 'papaparse';
import { normalizeEmail, validEmail, EVENT } from './rules.ts';
export type ImportResult = { rows: {email:string; minutes:number}[]; courseRows:number; duplicateRows:number; errors:string[] };
export function aggregate(matrix: unknown[][]): ImportResult {
  const header = (matrix[0] ?? []).map(v => String(v ?? '').trim().replace(/^\uFEFF/, ''));
  const col = (ko:string,en:string) => header.findIndex(v => v === ko || v === en);
  const ei = col('사용자 이메일','User Email'), mi = col('사용한 동영상 시간','Minutes Video Consumed'), ci = col('강의 ID','Course ID');
  if (ei < 0 || mi < 0 || ci < 0) throw new Error('필수 열이 없습니다: 사용자 이메일, 사용한 동영상 시간, 강의 ID');
  if (new Set(header).size !== header.length) throw new Error('중복된 열 이름이 있습니다. 원본 보고서를 다시 내려받아 주세요.');
  const totals = new Map<string,number>(), courses = new Map<string,number>();
  const errors:string[] = []; let duplicateRows = 0, courseRows = 0;
  matrix.slice(1).forEach((row,i) => {
    if (row.every(v => v == null || String(v).trim() === '')) return;
    const email = normalizeEmail(String(row[ei] ?? '')), course = String(row[ci] ?? '').trim(), raw = String(row[mi] ?? '').trim();
    const minutes = Number(raw.replaceAll(',', ''));
    if (!validEmail(email) || !course || !/^\d+(?:\.\d{1,2})?$/.test(raw.replaceAll(',', '')) || !Number.isFinite(minutes) || minutes < 0 || minutes > 1000000) { errors.push(`${i+2}행: 이메일, 강의 ID 또는 학습시간을 확인하세요.`); return; }
    const key = `${email}\t${course}`;
    if (courses.has(key)) { if (courses.get(key) !== minutes) errors.push(`${i+2}행: 동일 사용자·강의의 학습시간이 서로 다릅니다.`); else duplicateRows++; return; }
    courses.set(key, minutes); totals.set(email, (totals.get(email) ?? 0) + Math.round(minutes*100)); courseRows++;
  });
  if (!totals.size) errors.push('집계 가능한 학습 기록이 없습니다.');
  if (totals.size > 10000) errors.push('최대 10,000명까지 업로드할 수 있습니다.');
  return {rows:[...totals].map(([email, cents])=>({email,minutes:cents/100})),courseRows,duplicateRows,errors:errors.slice(0,20)};
}
export function parseCSV(text:string) {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/,''), {skipEmptyLines:'greedy'});
  if (parsed.errors.length) throw new Error('CSV 형식을 읽을 수 없습니다. UTF-8 CSV 원본을 사용하세요.');
  return aggregate(parsed.data);
}
export function validatePeriod(start:string,end:string,filename:string) {
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (start !== EVENT.start || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start || end > EVENT.end || end > today) throw new Error('집계 기간은 2026-10-06부터 오늘(최대 10/30)까지여야 합니다.');
  const dates = filename.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/);
  if (dates && (dates[1] !== start || dates[2] !== end)) throw new Error('파일명에 표시된 보고서 기간과 선택한 집계 기간이 다릅니다.');
}
