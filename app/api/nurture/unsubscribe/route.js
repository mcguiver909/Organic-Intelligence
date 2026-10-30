import {resumeAccess} from '../../../../lib/resume';
import {fail} from '../../../../lib/server';
export async function POST(req){try{const {db,review}=await resumeAccess(req);const {error}=await db.from('leads').update({nurture_withdrawn_at:new Date().toISOString(),nurture_status:'수신 거부'}).eq('id',review.lead_id);if(error)throw error;return Response.json({message:'후속 제품 안내 수신을 중단했습니다.'},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
