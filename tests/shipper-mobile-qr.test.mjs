import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
test('shipper supports image QR fallback without uploading photos and still searches only assigned deliveries',()=>{
  const source=readFileSync(resolve(root,'web-shipper/src/frontend/scan/Scan.tsx'),'utf8');
  assert.match(source,/import jsQR from "jsqr"/);
  assert.match(source,/getImageData/);
  assert.match(source,/createImageBitmap\(file\)/);
  assert.match(source,/file\.size > 8 \* 1024 \* 1024/);
  assert.match(source,/nativeDetector/);
  assert.match(source,/\/api\/shipper\/deliveries/);
  assert.match(source,/type="file"/);
  assert.doesNotMatch(source,/FormData\(|fetch\(.*image|uploadImage\(/);
  const pkg=JSON.parse(readFileSync(resolve(root,'web-shipper/package.json'),'utf8'));
  const lock=JSON.parse(readFileSync(resolve(root,'package-lock.json'),'utf8'));
  assert.equal(pkg.dependencies.jsqr, lock.packages['web-shipper'].dependencies.jsqr);
});
