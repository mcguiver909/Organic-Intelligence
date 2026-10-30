const publicKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
let role='';try{role=JSON.parse(Buffer.from(publicKey.split('.')[1]||'','base64url').toString()).role||'';}catch{}
if(publicKey.startsWith('sb_secret_')||role==='service_role')throw new Error('Server secret must not be configured as a NEXT_PUBLIC key.');
export default {outputFileTracingIncludes:{'/api/proposal':['./assets/*.ttf'],'/api/proposal/preview':['./assets/*.ttf'],'/api/email':['./assets/*.ttf']},async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Frame-Options',value:'DENY'}]}];}};
