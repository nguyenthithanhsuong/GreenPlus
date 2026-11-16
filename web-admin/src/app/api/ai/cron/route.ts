import { timingSafeEqual } from "node:crypto";
import { runAiMaintenance } from "../../../../../backend/modules/ai-assist/cron";
import { aiErrorResponse } from "../../../../../backend/modules/ai-assist/errors";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function authorized(request:Request){
 const key=process.env.GREENPLUS_AI_CRON_SECRET??"";
 const value=request.headers.get("authorization")?.replace(/^Bearer /,"")??"";
 if(!key||Buffer.byteLength(key)<32)return false;
 const a=Buffer.from(key),b=Buffer.from(value);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export async function POST(request:Request){
 if(process.env.GREENPLUS_AI_JOBS_ENABLED!=="true")return Response.json({error:"Scheduled AI is disabled"},{status:503});
 if(!authorized(request))return Response.json({error:"Unauthorized"},{status:401});
 try{const result=await runAiMaintenance();return Response.json(result,{status:result.ok?200:503,headers:{"Cache-Control":"no-store"}});}
 catch(e){return aiErrorResponse(e);}
}
