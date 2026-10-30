import {createHash} from 'node:crypto';
import {z} from 'zod';
import {admin,identity,jsonBody,fail,leadSchema} from '../../../lib/server';
import {makePdf} from '../../../lib/pdf';
export const runtime='nodejs';
export async function POST(req){try{
 const input=await jsonBody(req);
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL&&input.demo){const demo=leadSchema.parse(input.demo);return new Response(new Uint8Array(await makePdf({...demo,id:demo.requestId,created_at:new Date().toISOString()})),{headers:{'Content-Type':'application/pdf','Cache-Control':'no-store'}});}
 const body=z.object({id:z.uuid(),receipt:z.string().length(64).optional()}).parse(input);let db;
 if(body.receipt)db=admin();else ({db}=await identity(req,true));
 let q=db.from('leads').select('*').eq('id',body.id);
 if(body.receipt)q=q.eq('receipt_hash',createHash('sha256').update(body.receipt).digest('hex'));
 const {data,error}=await q.single();if(error||!data)throw Error('FORBIDDEN');
 const {data:booking}=await db.from('meeting_bookings').select('start_at').eq('lead_id',data.id).maybeSingle();
 return new Response(new Uint8Array(await makePdf({...data,confirmed_start:booking?.start_at})),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="ACRYL-ONE-meeting-brief.pdf"','Cache-Control':'no-store'}});
 }catch(e){return fail(e);}}
