// Text extraction for uploaded company documents (PDF, DOCX). Files are read in memory and never stored.
export const maxDocumentBytes=4*1024*1024;
export const documentURL=name=>'document:'+encodeURIComponent(String(name).replace(/[\\/]/g,'_').slice(0,120)||'document');
export const isDocumentURL=u=>typeof u==='string'&&u.startsWith('document:');
export const sourceLabel=u=>isDocumentURL(u)?decodeURIComponent(u.slice(9)):(()=>{try{return new URL(u).hostname;}catch{return u;}})();
export function documentKind(name='',type=''){
 if(/\.pdf$/i.test(name)||type==='application/pdf')return 'pdf';
 if(/\.docx$/i.test(name)||type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return 'docx';
 return null;
}
const clean=t=>String(t).replace(/\u0000/g,'').replace(/[ \t\f\v]+/g,' ').replace(/\s*\n\s*/g,'\n').trim();
// Split long documents into up to 3 sources so quotes stay within the 14,000-character snapshot limit.
export function documentSources(text,name){
 const body=clean(text);const url=documentURL(name);const out=[];
 for(let i=0;i<body.length&&out.length<3;i+=14000)out.push({url,title:name,text:body.slice(i,i+14000)});
 return out.filter(s=>s.text.length>=80);
}
