# Export pseudonymised ACRYL CRM prospects for the inbound customer DB seed (output is NOT committed).
import pandas as pd, numpy as np, json, sys
f,out=sys.argv[1],sys.argv[2]
c=pd.read_excel(f,'2_고객'); t=pd.read_excel(f,'3_접점')
p=c[c['고객등급']=='잠재고객'].copy()
def seg(s):
    s=str(s)
    if 'AI 플랫폼' in s: return 'AI 플랫폼'
    if 'GPUBASE' in s: return 'GPUBASE'
    if '헬스케어' in s: return '헬스케어 AX'
    return '미분류'
t['dt']=pd.to_datetime(t['접촉일시'],errors='coerce')
last=t.sort_values('dt').groupby('고객ID').agg(현장요청=('현장요청',lambda s:' / '.join(s.dropna().astype(str))[:300]),관심분야=('관심분야',lambda s:s.dropna().astype(str).iloc[-1][:200] if s.notna().any() else ''))
p=p.merge(last,left_on='고객ID',right_index=True,how='left')
rows=[]
for _,r in p.iterrows():
    nz=lambda v:None if pd.isna(v) else v
    rows.append({'customer_id':r['고객ID'],'org_id':nz(r['기관ID']),'lead_grade':nz(r['리드등급']),'sales_stage':nz(r['영업단계']),
     'segment':nz(r['세그먼트']),'org_type':r['기관유형'],'industry':r['산업분류'],'job_level':r['직급수준'],'interest_products':nz(r['관심제품']),
     'request_type':nz(r['최근요청유형']),'contact_count':int(r['접촉횟수']) if not pd.isna(r['접촉횟수']) else 0,'first_event':nz(r['첫접촉행사']),
     'email_type':r['이메일유형'],'onsite_request':(r['현장요청'] if isinstance(r['현장요청'],str) and r['현장요청'] else None),
     'interest_area':(r['관심분야'] or None) if isinstance(r['관심분야'],str) else None,
     'features':{'직급수준':None if r['직급수준']=='미상' else r['직급수준'],'이메일유형':r['이메일유형'],'요청':r['최근요청유형'] if isinstance(r['최근요청유형'],str) else '없음','세그':seg(r['세그먼트']),'기관유형':r['기관유형'],'다회접촉':'2회 이상' if (r['접촉횟수'] or 0)>=2 else '1회'}})
json.dump(rows,open(out,'w'),ensure_ascii=False)
print(len(rows))
