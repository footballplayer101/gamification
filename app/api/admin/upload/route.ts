import {createHash} from 'node:crypto';
import {isAdmin,sameOrigin,json} from '@/lib/security';
import {parseCSV,aggregate,validatePeriod} from '@/lib/import';
import {aliasFor} from '@/lib/data';
import {db,demoMode} from '@/lib/db';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!sameOrigin(request) || !(await isAdmin())) return json({error:'관리자 로그인이 필요합니다.'},401);
  if(demoMode())return json({error:'미리보기 모드에서는 실제 데이터를 저장할 수 없습니다. 운영 설정으로 전환하세요.'},409);
  if(Number(request.headers.get('content-length')||0)>4_000_000) return json({error:'최대 3MB 파일을 올려 주세요.'},413);
  try {
    const form=await request.formData(); const file=form.get('file');
    if(!(file instanceof File) || file.size>3_000_000) return json({error:'CSV 또는 XLSX 파일(최대 3MB)을 선택하세요.'},400);
    const start=String(form.get('start')??''),end=String(form.get('end')??'');
    validatePeriod(start,end,file.name);
    if(form.get('confirmed')!=='true')return json({error:'누적 보고서 기간을 확인해 주세요.'},400);
    const bytes=Buffer.from(await file.arrayBuffer());
    let result;
    if(file.name.toLowerCase().endsWith('.csv')) { const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes); result=parseCSV(text); }
    else if(file.name.toLowerCase().endsWith('.xlsx')) {
      const ExcelJS=await import('exceljs'); const book=new ExcelJS.Workbook(); await book.xlsx.load(bytes as never);
      const sheet=book.worksheets[0]; if(!sheet || sheet.rowCount>100000) throw new Error('첫 시트에 100,000행 이하의 보고서가 필요합니다.');
      const matrix:unknown[][]=[]; sheet.eachRow({includeEmpty:true},row=>matrix.push((row.values as unknown[]).slice(1))); result=aggregate(matrix);
    } else throw new Error('CSV 또는 XLSX 파일만 지원합니다.');
    if(result.errors.length)return json({error:result.errors.join('\n')},400);
    const preview={learners:result.rows.length,courseRows:result.courseRows,duplicateRows:result.duplicateRows,totalMinutes:Math.round(result.rows.reduce((s,r)=>s+r.minutes,0)*100)/100};
    const sql=db(); const current=(await sql`SELECT revision,as_of FROM event_state WHERE id=1`)[0];
    if(current?.as_of && end<current.as_of)throw new Error('현재 데이터보다 이전 기준일의 보고서는 반영할 수 없습니다.');
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(form.get('action')!=='commit')return json({preview,revision:current.revision,hash});
    if(form.get('hash')!==hash)throw new Error('파일이 변경되었습니다. 다시 검증하세요.');
    const rows=result.rows.map(row=>({...row,alias:aliasFor(row.email)}));
    const revision=Number(form.get('revision'));
    const changed=await sql`UPDATE event_state SET learners=${sql.json(rows)},as_of=${end},updated_at=NOW(),file_hash=${hash},revision=revision+1 WHERE id=1 AND revision=${revision} RETURNING revision`;
    if(!changed.length)return json({error:'다른 업데이트가 먼저 반영되었습니다. 파일을 다시 검증하세요.'},409);
    await sql`DELETE FROM request_limits WHERE bucket < ${Math.floor(Date.now()/60000)-1440}`.catch(()=>{});
    return json({ok:true,preview});
  }catch(error){ const message=error instanceof Error?error.message:''; const safe=/기간|파일|보고서|기준일|CSV|XLSX|시트|행|필수 열|중복된|UTF/.test(message);return json({error:safe?message:'파일 처리에 실패했습니다. 파일 형식과 서버 연결을 확인하세요.'},400); }
}
