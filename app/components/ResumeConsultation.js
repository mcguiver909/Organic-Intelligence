'use client';
import {useState,useEffect} from 'react';
export default function ResumeConsultation({onResume}){
 const [token,setToken]=useState(''),[action,setAction]=useState(''),[data,setData]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const p=new URLSearchParams(location.hash.slice(1)),v=p.get('resume')||p.get('unsubscribe');if(!v||!/^[a-f0-9]{64}$/.test(v))return;setToken(v);setAction(p.has('unsubscribe')?'unsubscribe':'resume');fetch('/api/nurture/resume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:v})}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setData(d);}).catch(e=>setNotice(e.message));},[]);
 async function unsubscribe(){setBusy(true);try{const r=await fetch('/api/nurture/unsubscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw Error(d.error);setNotice(d.message);setData(null);}catch(e){setNotice(e.message);}finally{setBusy(false);}}
 if(!token)return null;
 return <section className="panel company-discovery"><div className="eyebrow">CONTINUE YOUR CONVERSATION</div><h2>{action==='unsubscribe'?'후속 이메일 수신 설정':'이전 상담을 이어갈까요?'}</h2>{data&&<><p>{data.company}</p><p className="preserve">지난 상담: {data.summary}</p>{data.comparison?.quote&&<blockquote>이번에 확인한 공개 정보: “{data.comparison.quote}”</blockquote>}{action==='unsubscribe'?<button disabled={busy} onClick={unsubscribe}>후속 제품 안내 이메일 수신 중단</button>:<button className="primary" onClick={()=>{history.replaceState(null,'',location.pathname);onResume(data);setToken('');}}>지난 내용에서 이어서 대화하기 →</button>}</>}{notice&&<p role="status">{notice}</p>}</section>;
}
