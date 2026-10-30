import {z} from 'zod';
import {identity,quota,jsonBody,fail} from '../../../../lib/server';
import {reviewLead} from '../../../../lib/nurture';
export const maxDuration=60;
export async function POST(req){try{const {db,user}=await identity(req,true);await quota(db,user.id,'email');const {id}=z.object({id:z.uuid()}).parse(await jsonBody(req));const {data:lead,error}=await db.from('leads').select('*').eq('id',id).single();if(error||!lead)throw Error('FORBIDDEN');return Response.json(await reviewLead(db,lead,{early:true}));}catch(e){if(e.message==='ALREADY_REVIEWED')return Response.json({error:'이번 재확인 주기는 이미 처리했습니다. 검토 결과를 확인해 주세요.'},{status:409});return fail(e);}}
