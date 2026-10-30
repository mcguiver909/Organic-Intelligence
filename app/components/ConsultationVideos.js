'use client';
import {useState} from 'react';
import {consultationVideos} from '../../lib/videos.mjs';
export default function ConsultationVideos({slots,onQuestion,items}){
 const [open,setOpen]=useState(null);const videos=items||consultationVideos(slots);if(!videos.length)return null;
 return <section className="inline-videos"><div className="eyebrow">SHOW, THEN DISCUSS</div><h3>관련 공식 영상으로 확인해 보세요.</h3><p>상담을 유지한 채 소개·시연을 볼 수 있습니다.</p>{videos.map(v=><article key={v.id}><small>{v.kind} · {v.duration}</small><h4>{v.title}</h4><p>{v.reason}</p>{open===v.id?<iframe title={v.title} src={`https://www.youtube-nocookie.com/embed/${v.id}?rel=0`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<button className="video-play" type="button" onClick={()=>setOpen(v.id)}>▶ 상담 안에서 영상 열기</button>}<div className="video-actions"><a href={'https://www.youtube.com/watch?v='+v.id} target="_blank" rel="noreferrer">유튜브에서 보기 ↗</a>{onQuestion&&<button type="button" onClick={()=>onQuestion(`${v.product} 영상에서 본 기능을 우리 환경에 적용하려면 어떤 조건을 확인해야 하나요?`)}>이 영상의 기능으로 질문하기</button>}</div><small>공식 채널 제목·링크 확인 {v.verified}. 재생을 누르면 YouTube 플레이어에 연결됩니다. 임베드가 차단되면 유튜브에서 열어주세요.</small></article>)}</section>;
}
