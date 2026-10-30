import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {isIP,BlockList} from 'node:net';
const blocked=new BlockList();
for(const [ip,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]])blocked.addSubnet(ip,prefix,'ipv4');
const global6=new BlockList();global6.addSubnet('2000::',3,'ipv6');
const denied6=new BlockList();for(const [ip,prefix]of [['2001::',23],['2001:db8::',32],['2002::',16]])denied6.addSubnet(ip,prefix,'ipv6');
export function publicIP(ip){const family=isIP(ip);return family===4?!blocked.check(ip,'ipv4'):family===6&&global6.check(ip,'ipv6')&&!denied6.check(ip,'ipv6');}
export function websiteURL(input){const u=new URL(input);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||isIP(u.hostname.replace(/^\[|\]$/g,''))||!u.hostname.includes('.')||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal'))throw Error('UNSAFE_URL');u.hash='';return u;}
export async function pinnedAddress(host,resolve=lookup){const records=await resolve(host,{all:true,verbatim:true});if(!records.length||records.some(x=>!publicIP(x.address)))throw Error('UNSAFE_URL');return records[0];}
export async function readPublic(input,redirects=0){
 const u=websiteURL(input);const address=await Promise.race([pinnedAddress(u.hostname),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('DNS_TIMEOUT')),4000);t.unref();})]);
 const result=await new Promise((resolve,reject)=>{
  const req=request(u,{agent:false,headers:{'User-Agent':'ACRYL-ONE-Hackathon/1.0 (public company consultation)','Accept':'text/html','Accept-Encoding':'identity'},lookup:(_host,options,cb)=>cb(null,options.all?[address]:address.address,address.family)},res=>{
   if([301,302,303,307,308].includes(res.statusCode)){res.resume();resolve({redirect:res.headers.location});return;}
   if(res.statusCode!==200||!/^text\/(html|plain)\b/i.test(res.headers['content-type']||'')){res.resume();reject(Error('PAGE_UNAVAILABLE'));return;}
   let bytes=0;const chunks=[];res.on('data',c=>{bytes+=c.length;if(bytes>400000){res.destroy(Error('PAGE_TOO_LARGE'));return;}chunks.push(c);});res.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),url:u.href}));res.on('error',reject);
  });const deadline=setTimeout(()=>req.destroy(Error('PAGE_TIMEOUT')),6000);req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end();
 });
 if(result.redirect){if(redirects>=2)throw Error('TOO_MANY_REDIRECTS');return readPublic(new URL(result.redirect,u).href,redirects+1);}return result;
}
export function visibleText(html){return html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[m])).replace(/\s+/g,' ').trim().slice(0,14000);}
export function relatedLinks(html,base){const links=[];for(const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){try{const u=websiteURL(new URL(match[1],base).href);if(u.origin===new URL(base).origin&&u.href!==base&&/about|company|career|recruit|jobs|회사\s*소개|채용/i.test(u.pathname+' '+visibleText(match[2]))&&!links.includes(u.href))links.push(u.href);}catch{}}return links.slice(0,2);}
export async function collectCompany(url){const home=await readPublic(url);const pages=[home];const extra=await Promise.allSettled(relatedLinks(home.html,home.url).map(readPublicSafe));for(const p of extra)if(p.status==='fulfilled'&&new URL(p.value.url).origin===new URL(home.url).origin)pages.push(p.value);return pages.map(p=>({url:p.url,text:visibleText(p.html)})).filter(p=>p.text.length>=80);}
function readPublicSafe(url){return readPublic(url);}
