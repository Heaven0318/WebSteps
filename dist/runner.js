// Learner code runs in an opaque-origin sandbox, never in the application document.
// Fresh iframes clear listeners and timers between runs. Timeouts can replace a hung frame.
const escScript=value=>String(value).replaceAll('</script','<\\/script').replaceAll('<!--','<\\!--');
const STORAGE_KEY='websteps-preview-storage-v1';
let previewStorage={};
try{previewStorage=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(!previewStorage||typeof previewStorage!=='object'||Array.isArray(previewStorage))previewStorage={}}catch{previewStorage={}}
export function makeDocument(files,runId,checkKind){
  const js=escScript(files.js||'');
  const css=String(files.css||'').replaceAll('</style','<\\/style');
  const html=String(files.html||'');
  const control=`
    const RUN_ID=${JSON.stringify(runId)}; const KIND=${JSON.stringify(checkKind||'')};
    const send=(type,payload)=>parent.postMessage({source:'websteps-preview',runId:RUN_ID,type,payload},'*');
    const exerciseStore=${JSON.stringify(previewStorage)};
    const safeStorage={
      get length(){return Object.keys(exerciseStore).length},
      key(index){return Object.keys(exerciseStore)[index]??null},
      getItem(key){return Object.hasOwn(exerciseStore,String(key))?exerciseStore[String(key)]:null},
      setItem(key,value){exerciseStore[String(key)]=String(value);send('storage',{op:'set',key:String(key),value:String(value)})},
      removeItem(key){delete exerciseStore[String(key)];send('storage',{op:'remove',key:String(key)})},
      clear(){for(const key of Object.keys(exerciseStore))delete exerciseStore[key];send('storage',{op:'clear'})}
    };
    Object.defineProperty(window,'localStorage',{value:safeStorage,configurable:false});
    const data={title:'Study tasks',items:[{id:1,title:'Read HTML notes'},{id:2,title:'Practice CSS layout'}]};
    window.fetch=async input=>{
      const path=String(input);
      if(path.includes('scenario-slow'))await new Promise(resolve=>setTimeout(resolve,800));
      if(path.includes('scenario-fail'))return new Response('Unavailable',{status:503});
      if(path.includes('scenario-empty'))return new Response(JSON.stringify({title:'Study tasks',items:[]}),{status:200,headers:{'Content-Type':'application/json'}});
      if(path.includes('sample-data.json')||path.includes('scenario-success'))return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
      throw Error('Only bundled practice data is available in this preview.');
    };
    window.open=()=>null;
    const log=(level,args)=>send('console',{level,text:args.map(v=>{try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}}).join(' ')});
    for(const level of ['log','warn','error']){const original=console[level];console[level]=(...args)=>{log(level,args);original.apply(console,args)}}
    window.addEventListener('error',event=>send('error',{name:'Runtime error',message:event.message||'Unknown error'}));
    window.addEventListener('unhandledrejection',event=>send('error',{name:'Promise rejection',message:String(event.reason?.message||event.reason)}));
    function verify(){
      const text=element=>!!element?.textContent?.trim();
      const all=selector=>[...document.querySelectorAll(selector)];
      let checks=[];
      if(KIND==='lesson-06-guided'){
        const h1=all('h1'),h2=all('h2'),p=all('p');
        checks=[['One nonempty h1',h1.length===1&&text(h1[0])],['An introduction paragraph',p.length>=1&&text(p[0])],['One nonempty h2 after the h1',h2.length>=1&&text(h2[0])&&!!(h1[0]?.compareDocumentPosition(h2[0])&Node.DOCUMENT_POSITION_FOLLOWING)],['A second nonempty paragraph about interests',p.length>=2&&text(p[1])]];
      }else if(KIND==='lesson-06-challenge'){
        const section=all('section').find(s=>/about my website/i.test(s.querySelector('h1,h2,h3')?.textContent||''))||document.body;
        const heading=[...section.querySelectorAll('h1,h2,h3')].find(h=>/about my website/i.test(h.textContent));
        const paragraphs=[...section.querySelectorAll('p')].filter(text);
        checks=[['An About My Website section heading',!!heading],['Two nonempty paragraphs in that section',paragraphs.length>=2]];
      }else if(KIND.startsWith('lesson-04-')){
        const source=${JSON.stringify(html)};
        const lower=source.toLowerCase(),parsed=new DOMParser().parseFromString(source,'text/html');
        checks=[['A doctype starts the document',lower.trimStart().startsWith('<!doctype html>')],['The document has html, head, title, and body elements',['<html','<head','<title','<body'].every(tag=>lower.includes(tag))],['The title and visible body contain text',!!parsed.title.trim()&&!!parsed.body.textContent.trim()]];
      }else if(KIND.startsWith('lesson-05-')){
        checks=[['Page contains a properly linked anchor',all('a[href]').some(a=>a.textContent.trim()&&a.getAttribute('href')?.trim())],['Elements contain visible content',!!document.body.textContent.trim()]];
      }else if(KIND.startsWith('lesson-')){
        const number=Number(KIND.slice(7,9));
        const style=selector=>{const el=document.querySelector(selector);return el?getComputedStyle(el):null};
        const cssRules=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules]}catch{return []}});
        const out=document.querySelector('#out');
        const output=!!out?.textContent?.trim();
        const cssText=${JSON.stringify(css)};
        switch(number){
          case 7: checks=[['A list has at least two items',all('li').length>=2],['A section link points to an existing id',all('a[href^="#"]').some(a=>document.getElementById(a.hash.slice(1)))]];break;
          case 8: checks=[['An image has a source',all('img[src]').length>0],['Informative image has nonempty alt text',all('img').some(img=>img.alt.trim())]];break;
          case 9: checks=[['Header, main, and footer are present',!!document.querySelector('header')&&!!document.querySelector('main')&&!!document.querySelector('footer')],['Page has navigation',!!document.querySelector('nav')]];break;
          case 10: checks=[['A table names its data with a caption',!!document.querySelector('table caption')],['Table has header cells and at least two data rows',all('table th').length>0&&all('table tr').length>=3]];break;
          case 11: checks=[['A form has a labeled input',!!document.querySelector('form input')&&all('label').some(l=>l.control)],['A submit button is present',!!document.querySelector('button[type="submit"],form button:not([type])')]];break;
          case 12: checks=[['Related fields are grouped',!!document.querySelector('fieldset legend')],['An email field is required',!!document.querySelector('input[type="email"][required]')]];break;
          case 13: checks=[['A class selector is used',cssRules.some(r=>r.selectorText?.includes('.'))],['The note is visibly styled',!!style('.note')&&style('.note').color!==getComputedStyle(document.body).color]];break;
          case 14: checks=[['The specific note rule changes its color',!!style('.note')&&style('.note').color!==getComputedStyle(document.body).color],['No !important override is needed',!cssText.includes('!important')]];break;
          case 15: checks=[['Introduction text has a larger font',!!style('.intro')&&parseFloat(style('.intro').fontSize)>parseFloat(getComputedStyle(document.body).fontSize)],['Line height is comfortable',!!style('.intro')&&parseFloat(style('.intro').lineHeight)>parseFloat(style('.intro').fontSize)*1.3]];break;
          case 16: checks=[['Box has inner spacing',!!style('.box')&&parseFloat(style('.box').paddingTop)>0],['Box has outer spacing',!!style('.box')&&parseFloat(style('.box').marginTop)>0]];break;
          case 17: checks=[['Card has a background distinct from page',!!style('.card')&&style('.card').backgroundColor!==getComputedStyle(document.body).backgroundColor],['Card has a visible border',!!style('.card')&&parseFloat(style('.card').borderTopWidth)>0]];break;
          case 18: checks=[['Box has a width limit',!!style('.box')&&style('.box').maxWidth!=='none'],['Long content can wrap',!!style('.box')&&['anywhere','break-word'].includes(style('.box').overflowWrap)]];break;
          case 19: checks=[['Navigation uses Flexbox',style('nav')?.display==='flex'],['Items have a gap',!!style('nav')&&parseFloat(style('nav').columnGap)>0]];break;
          case 20: checks=[['Card container uses Grid',style('.grid')?.display==='grid'],['Grid has multiple columns',!!style('.grid')&&style('.grid').gridTemplateColumns.split(' ').length>=2]];break;
          case 21: checks=[['Badge is positioned',!!style('.badge')&&style('.badge').position!=='static'],['A top offset is set',!!style('.badge')&&style('.badge').top!=='auto']];break;
          case 22: checks=[['A media query is defined',cssRules.some(r=>r.conditionText||r.media)],['Images can shrink inside their container',!!style('img')&&style('img').maxWidth!=='none']];break;
          case 23: checks=[['Button has a focus-visible rule',cssRules.some(r=>r.selectorText?.includes(':focus-visible'))],['Button exists for keyboard testing',!!document.querySelector('button')]];break;
          case 24: checks=[['A transition is defined',!!style('button')&&style('button').transitionDuration!=='0s'],['Reduced motion is addressed',cssRules.some(r=>String(r.conditionText||'').includes('prefers-reduced-motion'))]];break;
          case 25: checks=[['A value appears in the result',output],['The result is not the starter text',out?.textContent?.trim()!=='Ready']];break;
          case 26: checks=[['A comparison result is shown',output],['Result is true or false',/^(true|false)$/i.test(out?.textContent?.trim()||'')]];break;
          case 27: checks=[['A greeting is shown',output],['Greeting includes more than one word',(out?.textContent?.trim().split(' ').length||0)>=2]];break;
          case 28: checks=[['A chosen branch produces output',output],['Output differs from the starter',out?.textContent?.trim()!=='Ready']];break;
          case 29: checks=[['A function result is displayed',output],['Result is a number',Number.isFinite(Number(out?.textContent?.trim()))]];break;
          case 30: checks=[['Loop result is displayed',output],['Sum is numeric',Number.isFinite(Number(out?.textContent?.trim()))]];break;
          case 31: checks=[['Array result is displayed',output],['Count is numeric',Number.isFinite(Number(out?.textContent?.trim()))]];break;
          case 32: checks=[['Object property is displayed',output],['Property text is not the starter',out?.textContent?.trim()!=='Ready']];break;
          case 33: checks=[['Filtered result is displayed',output],['Result is numeric',Number.isFinite(Number(out?.textContent?.trim()))]];break;
          case 34: checks=[['Selected text is updated',!!out&&out.textContent.trim()!=='Old'&&out.textContent.trim()!=='' ]];break;
          case 35: {const before=out?.textContent;document.querySelector('button')?.click();checks=[['Click changes the message',!!out&&out.textContent!==before&&text(out)]];break}
          case 36: {document.querySelector('button')?.click();checks=[['A list item is created',all('ul li,ol li').length>0],['List item has text',all('ul li,ol li').some(text)]];break}
          case 37: checks=[['A labeled input exists',all('label').some(l=>l.control)],['A field-specific feedback element exists',!!document.querySelector('#error,[role="alert"]')]];break;
          case 38: checks=[['Exercise data is saved separately',safeStorage.length>0],['Restored data is shown',output]];break;
          case 39: checks=[['Damaged data is handled without a runtime error',output],['A safe result is displayed',Number.isFinite(Number(out?.textContent?.trim()))]];break;
          case 40: checks=[['Promise result is displayed',output],['The result moved beyond waiting',out?.textContent?.trim()!=='Waiting']];break;
          case 41: checks=[['Bundled data title is displayed',output],['Loading state was replaced',out?.textContent?.trim()!=='Loading']];break;
          case 42: checks=[['A retry or load action exists',!!document.querySelector('button')],['A feedback region exists',!!out]];break;
          case 45: checks=[['Page has a narrow-friendly width limit',!!style('main')&&style('main').maxWidth!=='none'],['Content has visible spacing',!!style('main')&&parseFloat(style('main').paddingLeft)>0]];break;
          case 47: {const button=document.querySelector('#theme');const before=document.body.className;button?.click();checks=[['Theme button changes the page',!!button&&document.body.className!==before],['Projects are rendered from data',all('#cards article').length>=2]];break}
          default: checks=[['Preview runs',true],['Example has visible content',!!document.body.textContent.trim()]];break;
        }
      }else if(KIND==='project-1'){
        const links=all('nav a[href^="#"]');
        checks=[['Main heading and about section',!!document.querySelector('h1')&&!!document.querySelector('section')],['Navigation points to existing sections',links.length>0&&links.every(a=>document.getElementById(a.hash.slice(1)))],['Informative image has alt text',all('img').some(img=>img.hasAttribute('alt')&&img.alt.trim())],['Study table has a caption and headers',!!document.querySelector('table caption')&&!!document.querySelector('table th')],['Practice form has labeled input',!!document.querySelector('form input')&&all('label').some(l=>l.control)],['Footer exists',!!document.querySelector('footer')]];
      }else if(KIND==='project-2'){
        checks=[['Header, navigation, and hero heading',!!document.querySelector('header nav')&&!!document.querySelector('h1')],['Feature cards and final action',all('article,.card').length>=2&&all('a,button').length>=2],['Footer exists',!!document.querySelector('footer')],['Keyboard focus has a visible style',!![...document.styleSheets].some(sheet=>{try{return [...sheet.cssRules].some(rule=>rule.cssText.includes('focus-visible'))}catch{return false}})]];
      }else if(KIND==='project-3'){
        checks=[['Task title and subject inputs',!!document.querySelector('input')&&all('input').length>=2],['Task list and add control',!!document.querySelector('ul,ol')&&!!document.querySelector('button')],['Useful feedback area',!!document.querySelector('[role="status"],[aria-live],#error')]];
      }else if(KIND==='project-4'){
        checks=[['Introduction and projects',!!document.querySelector('h1')&&!!document.querySelector('#projects')],['Working section navigation',all('nav a[href^="#"]').some(a=>document.getElementById(a.hash.slice(1)))],['Project cards rendered from data',all('#projects article,#projects .card').length>=2],['Theme control present',!!document.querySelector('button[id*="theme"],button[class*="theme"]')]];
      }else{
        checks=[['The example runs without a JavaScript error',true],['The page contains visible content',!!document.body.textContent.trim()||!!document.body.querySelector('img,input,button')]];
      }
      send('checks',checks.map(([label,pass])=>({label,pass})));
    }
    window.addEventListener('load',()=>{send('ready',{});if(KIND)setTimeout(verify,[40,41,42].includes(Number(KIND.slice(7,9)))?950:0)});
  `;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:; connect-src 'none'; form-action 'none'"><style>body{font:16px/1.5 system-ui;margin:16px;color:#161b23}*{box-sizing:border-box}${css}</style></head><body>${html}<script>${control}</script><script>try{${js}\n}catch(error){parent.postMessage({source:'websteps-preview',runId:${JSON.stringify(runId)},type:'error',payload:{name:error.name,message:error.message}},'*')}</script></body></html>`;
}
let active=null;
export function execute(frame,files,{checkKind='',onMessage,onTimeout}){
  if(active){clearTimeout(active.timer);active.worker?.terminate();active.frame.srcdoc='';window.removeEventListener('message',active.listener);active=null}
  const runId=crypto.randomUUID();
  const listener=event=>{
    if(event.source!==frame.contentWindow||event.data?.source!=='websteps-preview'||event.data?.runId!==runId)return;
    if(!['ready','console','error','checks','storage'].includes(event.data.type))return;
    const payload=event.data.payload;
    if(payload===null||typeof payload!=='object')return;
    if(event.data.type==='storage'){
      if(payload.op==='clear')previewStorage={};
      else if(typeof payload.key==='string'&&payload.key.length<=200){
        if(payload.op==='remove')delete previewStorage[payload.key];
        if(payload.op==='set'&&typeof payload.value==='string'&&payload.value.length<=200000)previewStorage[payload.key]=payload.value;
      }
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(previewStorage))}catch{}
      return;
    }
    onMessage(event.data.type,payload);
    if(event.data.type==='ready'&&active?.runId===runId)clearTimeout(active.timer)
  };
  window.addEventListener('message',listener);
  const stop=()=>{if(active?.runId!==runId)return;active.worker?.terminate();frame.srcdoc='<!doctype html><p style="font:16px system-ui;padding:16px">Preview stopped because the code took too long. Your draft is safe. Edit it and run again.</p>';onTimeout()};
  const timer=setTimeout(stop,3000);
  active={runId,frame,timer,listener,worker:null};
  const js=String(files.js||'');
  if(!js.trim()){frame.srcdoc=makeDocument(files,runId,checkKind)}
  else{
    // Preflight in a separate thread catches syntax errors and common runaway loops.
    // DOM-dependent code can throw in this Worker and then run in the sandboxed preview.
    const source='onmessage=()=>{try{new Function('+JSON.stringify(js)+')();postMessage({type:"done"})}catch(e){postMessage({type:e instanceof SyntaxError?"syntax":"done",message:String(e.message||e)})}}';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    const worker=new Worker(url);
    URL.revokeObjectURL(url);
    active.worker=worker;
    const preflight=setTimeout(()=>{if(active?.runId===runId){worker.terminate();clearTimeout(active.timer);stop()}},700);
    worker.onmessage=event=>{if(active?.runId!==runId)return;clearTimeout(preflight);worker.terminate();active.worker=null;if(event.data?.type==='syntax'){clearTimeout(active.timer);onMessage('error',{name:'Syntax error',message:event.data.message});return}frame.srcdoc=makeDocument(files,runId,checkKind)};
    worker.onerror=()=>{if(active?.runId!==runId)return;clearTimeout(preflight);worker.terminate();active.worker=null;frame.srcdoc=makeDocument(files,runId,checkKind)};
    worker.postMessage(null);
  }
  return ()=>{if(active?.runId===runId){clearTimeout(active.timer);active.worker?.terminate();active=null}window.removeEventListener('message',listener)};
}
