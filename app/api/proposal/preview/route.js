import {z} from 'zod';
import {consultationAccess,jsonBody,fail,slotsSchema,briefSchema} from '../../../../lib/server';
import {makePdf} from '../../../../lib/pdf';
export const runtime='nodejs';
export async function POST(req){try{await consultationAccess(req);const data=z.object({id:z.uuid(),company:z.string().max(160),name:z.string().max(80).default(''),summary:z.string().min(5).max(3000),slots:slotsSchema,brief:briefSchema}).parse(await jsonBody(req));const pdf=await makePdf({...data,meeting:false,created_at:new Date().toISOString()});return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="ACRYL-ONE-meeting-brief.pdf"','Cache-Control':'no-store'}});}catch(e){return fail(e);}}
