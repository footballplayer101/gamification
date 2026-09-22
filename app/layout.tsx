import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'APR, 나혼자만 레벨업',description:'학습할수록 성장하는 나. APR Udemy 학습 이벤트에서 내 레벨과 랭킹을 확인하세요.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
