import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZlbxClient, PaymentRequiredError, ZlbxApiError } from '../../packages/core/src/api-client.mjs';
import { getOrCreateDeviceId } from '../../packages/core/src/device-store.mjs';
import { resolveApiRoute } from './src/router.mjs';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, 'public');
const port = Number(process.env.PORT || 8787);
const MIME = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml; charset=utf-8' };
function sendJson(res,status,payload){const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store'});res.end(body);}
async function readJson(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1_000_000)throw new Error('请求体过大');chunks.push(chunk);}if(!chunks.length)return {};return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
function errorPayload(error){if(error instanceof PaymentRequiredError||error instanceof ZlbxApiError)return error.toJSON();return{type:'unexpected_error',message:error?.message||String(error)};}
async function serveStatic(pathname,res){const safe=normalize(pathname==='/'?'/index.html':pathname).replace(/^([/\\])+/, '');const file=join(publicDir,safe);if(!file.startsWith(publicDir))return false;try{const info=await stat(file);if(!info.isFile())return false;res.writeHead(200,{'content-type':MIME[extname(file)]||'application/octet-stream'});createReadStream(file).pipe(res);return true;}catch{return false;}}
export async function startWorkbench({listenPort=port,client}={}){const deviceId=client?null:await getOrCreateDeviceId();const zlbx=client||createZlbxClient({deviceId});const server=createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);const route=resolveApiRoute(req.method,url.pathname);if(route){try{let data;if(route.kind==='tool')data=await zlbx.callTool(route.tool,await readJson(req));else if(route.kind==='account_balance')data=await zlbx.getBalance();else data=await zlbx.getDailyConsumption(Object.fromEntries(url.searchParams));sendJson(res,200,{success:true,data});}catch(error){const status=error instanceof PaymentRequiredError?402:error instanceof ZlbxApiError&&error.status?error.status:500;sendJson(res,status,{success:false,error:errorPayload(error)});}return;}if(url.pathname.startsWith('/api/')){sendJson(res,404,{success:false,error:{type:'not_found',message:'未知 API 路由'}});return;}if(!(await serveStatic(url.pathname,res))){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');}});await new Promise((resolve)=>server.listen(listenPort,resolve));return server;}
if(import.meta.url===`file://${process.argv[1]}`){const server=await startWorkbench();const address=server.address();console.log(`知了标讯 WorkBuddy 商机作战台已启动：http://127.0.0.1:${address.port}`);}
