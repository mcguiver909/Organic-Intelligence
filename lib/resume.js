import 'server-only';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {admin,jsonBody} from './server';
export async function resumeAccess(req){const {token}=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).parse(await jsonBody(req));const db=admin();const hash=createHash('sha256').update(token).digest('hex');const {data:review,error}=await db.from('nurture_reviews').select('lead_id,comparison,created_at').eq('resume_hash',hash).single();if(error||!review||Date.now()-Date.parse(review.created_at)>183*86400000)throw Error('FORBIDDEN');return {db,review};}
