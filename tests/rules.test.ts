import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levelOf,eligible,progression,rankLearners} from '../lib/rules.ts';
import {parseCSV,validatePeriod} from '../lib/import.ts';
test('reward thresholds preserve fractional minutes',()=>{
  for(const [minutes,level,reward] of [[0,0,false],[14.99,0,false],[15,1,true],[59.99,1,true],[60,2,true],[119.99,2,true],[120,3,true],[800,3,true]]){assert.equal(levelOf(Number(minutes)),level);assert.equal(eligible(Number(minutes)),reward);}
});
test('competition ranking keeps ties and skips the following rank',()=>{
  const rows=rankLearners([{email:'a@x.co',minutes:120,alias:'a'},{email:'b@x.co',minutes:120,alias:'b'},{email:'c@x.co',minutes:60,alias:'c'}]);assert.deepEqual(rows.map(r=>r.rank),[1,1,3]);
});
test('goals cover the first reward and maximum level',()=>{assert.equal(progression(0).target,15);assert.equal(progression(15).target,60);assert.equal(progression(60).target,120);assert.equal(progression(120).percent,100);assert.equal(progression(180).remaining,0);});
test('CSV supports BOM, quoted commas/newlines, email normalization and duplicate rows',()=>{
  const csv='\uFEFF사용자 이메일,강의 ID,사용한 동영상 시간,강의 제목\r\n" A@EXAMPLE.COM ",1,14.75,"Hello, world"\r\na@example.com,2,0.25,"multi\nline"\r\na@example.com,1,14.75,hello';
  const p=parseCSV(csv);assert.deepEqual(p.errors,[]);assert.equal(p.rows[0].minutes,15);assert.equal(p.rows[0].email,'a@example.com');assert.equal(p.duplicateRows,1);
});
test('conflicting course duplicates must not silently double count',()=>{const p=parseCSV('사용자 이메일,강의 ID,사용한 동영상 시간\na@x.co,1,10\na@x.co,1,12');assert.equal(p.errors.length,1);});
test('missing and malformed values reject whole import',()=>{assert.throws(()=>parseCSV('email,time\na@x.co,15'));for(const time of ['','NaN','-1','1e3']){assert.ok(parseCSV(`사용자 이메일,강의 ID,사용한 동영상 시간\na@x.co,1,${time}`).errors.length>0);}});
test('September sample cannot enter the October competition',()=>{assert.throws(()=>validatePeriod('2026-09-01','2026-09-20','report.csv'));});
