import pandas as pd, numpy as np, json, sys
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import roc_auc_score, brier_score_loss
f=sys.argv[1]; out=sys.argv[2]
c=pd.read_excel(f,'2_고객'); p=c[c['고객등급']=='잠재고객'].copy()
p['y']=p['리드등급'].isin(['A','B']).astype(int)
def seg(s):
    s=str(s)
    if 'AI 플랫폼' in s: return 'AI 플랫폼'
    if 'GPUBASE' in s: return 'GPUBASE'
    if '헬스케어' in s: return '헬스케어 AX'
    return '미분류'
p['세그']=p['세그먼트'].map(seg)
p['요청']=p['최근요청유형'].fillna('없음')
p['다회접촉']=np.where(p['접촉횟수']>=2,'2회 이상','1회')
p['뉴스레터']=p['뉴스레터수신동의'].fillna('미조사')
FEATS={'직급수준':['경영진/임원','관리자','교수/의료진/연구위원','실무자','학생/인턴','기타'],
 '이메일유형':['기업/기관 도메인','공공/비영리','대학','개인 웹메일','없음'],
 '요청':['견적·가격 문의','도입 검토','미팅 요청','제휴·투자 문의','자료 요청','기타 문의','없음'],
 '세그':['GPUBASE','AI 플랫폼','헬스케어 AX','미분류'],
 '기관유형':['기업','의료기관','대학/교육기관','공공/연구기관','미상'],
 '다회접촉':['1회','2회 이상']}
known=p[p['직급수준']!='미상'].copy()
def X(df):
    cols=[]
    for k,vals in FEATS.items():
        for v in vals[1:]: cols.append((df[k]==v).astype(float).rename(f'{k}={v}'))
    return pd.concat(cols,axis=1)
Xk=X(known); yk=known['y'].values
print('train rows',len(known),'positive',yk.mean().round(3))
Xtr,Xte,ytr,yte=train_test_split(Xk,yk,test_size=0.25,random_state=7,stratify=yk)
m=LogisticRegression(C=1.0,max_iter=2000).fit(Xtr,ytr)
pt=m.predict_proba(Xte)[:,1]
auc=roc_auc_score(yte,pt); brier=brier_score_loss(yte,pt)
base=LogisticRegression(max_iter=2000).fit(Xtr.filter(like='직급수준='),ytr)
auc_base=roc_auc_score(yte,base.predict_proba(Xte.filter(like='직급수준='))[:,1])
cv=cross_val_score(LogisticRegression(C=1.0,max_iter=2000),Xk,yk,cv=StratifiedKFold(5,shuffle=True,random_state=7),scoring='roc_auc')
# calibration bins
bins=pd.cut(pt,[0,.1,.3,.5,.7,.9,1.0],include_lowest=True)
cal=pd.DataFrame({'p':pt,'y':yte}).groupby(bins,observed=True).agg(n=('y','size'),pred=('p','mean'),actual=('y','mean')).round(3)
print('holdout AUC',round(auc,3),'brier',round(brier,4),'rank-only AUC',round(auc_base,3),'cv AUC',cv.mean().round(3),'+-',cv.std().round(3))
print(cal)
# final fit on all known rows
mf=LogisticRegression(C=1.0,max_iter=2000).fit(Xk,yk)
coef={col:round(float(w),4) for col,w in zip(Xk.columns,mf.coef_[0])}
# rank prior for marginalising unknown rank
prior=known['직급수준'].value_counts(normalize=True).round(4).to_dict()
model={'name':'ACRYL CRM 리드 우선순위 모델','version':'2026-10-31','label':'잠재고객 리드등급 A·B 등록 여부 (데이터 제공사 모의 생성)',
 'trainRows':int(len(known)),'positiveRate':round(float(yk.mean()),4),
 'metrics':{'holdoutAUC':round(auc,3),'holdoutBrier':round(brier,4),'cvAUC':round(float(cv.mean()),3),'cvAUCStd':round(float(cv.std()),3),'rankOnlyAUC':round(auc_base,3),'holdoutRows':int(len(yte))},
 'intercept':round(float(mf.intercept_[0]),4),'features':FEATS,'coef':coef,'rankPrior':prior,'priors':{k:{v:round(float((known[k]==v).mean()),4) for v in vals} for k,vals in FEATS.items()}}
agg=known.groupby(['직급수준','요청','세그'])['y'].agg(['size','sum'])
model['similar']={f'{a}|{b}|{c}':[int(n),int(k)] for (a,b,c),(n,k) in agg.iterrows()}
json.dump(model,open(out,'w'),ensure_ascii=False,indent=1)
print(json.dumps(coef,ensure_ascii=False)[:1500]); print('intercept',model['intercept'],prior)
