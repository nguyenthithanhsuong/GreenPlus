/** Static inventory. Finds likely messages/notifications without reading secrets. */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(fileURLToPath(new URL("../..",import.meta.url)));
const dirs=["web-admin/frontend","web-admin/src/app","web-admin/backend",
            "web-client/frontend","web-client/src/app","web-client/backend",
            "web-shipper/src/frontend","web-shipper/src/app","web-shipper/src/server"];
const patterns={
  error:/\b(?:setError|throw new Error|throw new AiError|throw new ChatError)\s*\(/g,
  notification:/\b(?:toast\s*\(|notify\s*\(|alert\s*\(|setToast\s*\(|setMessage\s*\(|setSaveMessage\s*\()/g,
  console:/\bconsole\.(?:log|debug|info|warn|error)\s*\(/g,
};
const items=[];
function scan(folder) {
  for(const item of readdirSync(folder,{withFileTypes:true})) {
    const path=join(folder,item.name);
    if(item.isDirectory())scan(path);
    else if(item.isFile() && [".ts",".tsx",".mjs",".js"].includes(extname(path))){
      const content=readFileSync(path,"utf8");
      const result=Object.fromEntries(Object.entries(patterns).map(([kind,re])=>[kind,[...content.matchAll(re)].length]));
      if(Object.values(result).some(Boolean))items.push({file:relative(root,path).replaceAll("\\","/"),...result});
    }
  }
}
for(const dir of dirs)scan(resolve(root,dir));
items.sort((a,b)=>a.file.localeCompare(b.file));
const totals=Object.fromEntries(Object.keys(patterns).map(key=>[key,items.reduce((n,item)=>n+item[key],0)]));
console.log(JSON.stringify({description:"Static grep inventory only; not a complete semantic notification audit",files:items.length,totals,items},null,2));
