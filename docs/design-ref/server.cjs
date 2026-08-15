const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(url.parse(req.url).pathname);
  if(p==='/')p='/Accueil PAACIV.dc.html';
  const f=path.join(__dirname,p);
  fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);return res.end('404 '+p);} res.writeHead(200,{'Content-Type':types[path.extname(f).toLowerCase()]||'application/octet-stream'}); res.end(d); });
}).listen(4599,()=>console.log('design-ref on http://localhost:4599'));
