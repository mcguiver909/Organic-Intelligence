import {z} from 'zod';
import {identity,jsonBody,fail} from '../../../lib/server';
export async function POST(req){try{const {db,user}=await identity(req,true);const {id,start}=z.object({id:z.uuid(),start:z.iso.datetime()}).parse(await jsonBody(req));const {error}=await db.rpc('confirm_meeting',{p_lead:id,p_staff:user.id,p_start:start});if(error)return Response.json({error:'확정할 수 없습니다. 이미 확정된 상담, 중복 일정, 지난 시각 또는 제출되지 않은 시간인지 확인해 주세요.'},{status:409});return Response.json({message:'해커톤 팀 미팅 일정이 확정되었습니다. 실제 ACRYL 담당자 일정에는 등록되지 않았습니다.'});}catch(e){return fail(e);}}
