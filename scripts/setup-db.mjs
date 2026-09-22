import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL을 .env.local에 설정하세요.');
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false});
try {await sql.unsafe(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8')); console.log('데이터베이스 초기화 완료');} finally {await sql.end();}
