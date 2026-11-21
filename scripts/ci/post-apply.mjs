/** One-time migration from obsolete Shipper-specific secret bootstrap to shared auth.
 * Only removes the exact old known script; does not read or write .env files.
 */
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const path=resolve(import.meta.dirname,'../setup-shipper-env.mjs');
const expected='ccf07a6818a751827a9ea6d6db101bf163455e6e5743aed56a6b88e5555446cc';
if(existsSync(path)){
  const actual=createHash('sha256').update(readFileSync(path)).digest('hex');
  if(actual!==expected){
    console.error('BLOCKED: legacy Shipper setup script was modified locally; review it before manual removal.');
    process.exitCode=1;
  }else{
    unlinkSync(path);
    console.log('PASS: removed obsolete Shipper-specific env bootstrap (shared auth key remains unchanged).');
  }
}else console.log('PASS: obsolete Shipper env bootstrap already absent.');
