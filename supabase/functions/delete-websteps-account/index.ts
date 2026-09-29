// Deploy to the dedicated WebSteps Supabase project with JWT verification enabled.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const allowed = new Set([
    'https://websteps-cedrick-learning.cedrickyosh-pereyra.chatgpt.site',
    'http://localhost:4173'
  ]);
  if (origin && !allowed.has(origin)) return new Response('Forbidden origin', {status:403});
  const cors = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405,headers:cors});
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if (!token) return new Response('Unauthorized', {status:401});
  const url = Deno.env.get('SUPABASE_URL')!;
  const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!);
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
  const publishable = publishableKeys.default;
  const serviceRole = secretKeys.default;
  const userClient = createClient(url,publishable,{global:{headers:{Authorization:'Bearer '+token}}});
  const {data:{user},error:authError}=await userClient.auth.getUser(token);
  if (authError || !user) return new Response('Unauthorized', {status:401});
  const body=await request.json().catch(()=>({}));
  if (body.confirm!==true) return new Response('Confirmation required', {status:400});
  const admin=createClient(url,serviceRole);
  const {error}=await admin.auth.admin.deleteUser(user.id);
  if (error) return new Response('Could not delete account', {status:500});
  return Response.json({deleted:true},{headers:cors});
});
