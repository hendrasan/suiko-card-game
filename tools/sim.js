const fs=require('fs'),vm=require('vm');
const root=process.argv[2]; const N=+process.argv[3]||50;
const ctx={console,setTimeout,Math,Set,Promise};vm.createContext(ctx);
for(const f of ['cards','decks','engine','ai']) vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8').replace(/^const |^let |^class (\w+)/gm,(m,c)=>c?`var ${c} = class ${c}`:'var '),ctx,{filename:f});
vm.runInContext(`
var problems=[];
function check(name,ids){ if(ids.length!==50) problems.push(name+' size '+ids.length);
 const c={}; ids.forEach(i=>{c[i]=(c[i]||0)+1; if(!CARDS[i]) problems.push(name+' bad id '+i)});
 for(const k in c) if(c[k]>3) problems.push(name+' >3 of '+k); }
check('starter',parseDeck(STARTER_DECK)); OPPONENTS.forEach(o=>check(o.id,parseDeck(o.deck)));
for(let i=1;i<=250;i++) if(!CARDS[i]) problems.push('missing card '+i);
`,ctx);
console.log('problems',ctx.problems);
(async()=>{
 const stats={}; let turns=0, errs=0;
 for(let k=0;k<N;k++){
  const o=ctx.OPPONENTS[k%ctx.OPPONENTS.length];
  const g=new ctx.Game({delay:0,players:[
   {name:'P',deck:ctx.parseDeck(ctx.STARTER_DECK),vpTarget:o.vp[0],ctl:ctx.AI},
   {name:o.name,deck:ctx.parseDeck(o.deck),mm:o.mm,vpTarget:o.vp[1],ctl:ctx.AI}]});
  try{ const w=await g.run(); stats[o.id]=stats[o.id]||[0,0]; stats[o.id][w]++; turns+=g.turnNo;}
  catch(e){errs++; if(errs<4) console.log('ERR',o.id,e.stack.split('\n').slice(0,5).join('\n'), g.logs.slice(-6));}
 }
 console.log(JSON.stringify(stats),'avg turns',(turns/N).toFixed(1),'errors',errs);
})();
