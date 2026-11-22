import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {serverlessChat} from '../packages/ai-core/serverless-ai.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/ai-chat-evaluation.json',import.meta.url),'utf8'));
test('curated AI evaluation: direct/paraphrased FAQ and out-of-scope queries',async(t)=>{
 let correct=0,wrong=0,falseMatches=0;const violations=[];
 for(const row of fixture.cases){
  const result=await serverlessChat({store_id:fixture.store_id,role:'customer',level:'low',locale:'vi',question:row.question,knowledge:fixture.knowledge});
  const source=result.sources[0]??null;
  if(source===row.expected)correct++;
  else{wrong++;violations.push({question:row.question,expected:row.expected,actual:source});}
  if(row.expected===null && source!==null)falseMatches++;
 }
 t.diagnostic(`FAQ offline evaluation: ${correct}/${fixture.cases.length} correct; ${falseMatches} false matches; ${wrong} errors`);
 assert.equal(falseMatches,0,JSON.stringify(violations));
 // Paraphrase recall is measured but not disguised as a verified LLM evaluation.
 assert.ok(correct>=29,JSON.stringify(violations));
});
