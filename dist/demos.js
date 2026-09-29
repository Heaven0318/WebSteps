const cssDemos={
  'lesson-15':{title:'Font size and line height',controls:[['font-size',16,16,32,1,'px'],['line-height',1.2,1,2.2,.1,'']]},
  'lesson-16':{title:'Padding versus margin',controls:[['padding',16,0,48,1,'px'],['margin',16,0,48,1,'px']]},
  'lesson-19':{title:'Flexbox alignment',controls:[['alignment',0,0,2,1,'']]},
  'lesson-20':{title:'Grid columns',controls:[['columns',2,1,4,1,'']]},
  'lesson-24':{title:'Transition duration',controls:[['duration',.2,0,2,.1,'s']]}
};
const jsDemos={
  'lesson-25':['let score = 1;','score is 1','score += 2;','score is 3'],
  'lesson-28':['const ready = false;','ready is false','if (ready) { ... } else { ... }','the else branch runs'],
  'lesson-29':['double(4)','input n = 4','return n * 2','result is 8'],
  'lesson-30':['for (let n = 1; n <= 3; n++)','n = 1','n = 2','n = 3','condition is false; stop'],
  'lesson-35':['listener is attached','user clicks button','handler runs','message changes'],
  'lesson-40':['Promise starts','pending','asynchronous work finishes','fulfilled result updates the page']
};
export function mountDemo(lesson,host){
  if(!host||!lesson)return;
  const css=cssDemos[lesson.id],steps=jsDemos[lesson.id];
  if(css){
    const section=document.createElement('section');section.className='card demo';section.innerHTML='<h2>Try the CSS</h2><p></p><div class="demo-target"><span>Practice card</span></div><div class="demo-controls"></div><pre class="code-block demo-code"></pre>';
    section.querySelector('p').textContent=css.title+': move a control to see the change.';
    const controls=section.querySelector('.demo-controls');
    for(const [name,value,min,max,step,unit] of css.controls){
      const label=document.createElement('label');label.className='field-label';label.style.marginTop='12px';label.textContent=name+' ';
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;input.setAttribute('aria-label',name);
      const output=document.createElement('span');output.className='small muted';output.textContent=value+unit;
      input.addEventListener('input',()=>{output.textContent=input.value+unit;draw()});label.append(input,output);controls.append(label);
    }
    if(lesson.id==='lesson-16'){
      const label=document.createElement('label');label.className='field-label';label.textContent='box-sizing';label.style.marginTop='12px';
      const select=document.createElement('select');select.className='field';select.setAttribute('aria-label','Box sizing');select.innerHTML='<option value="content-box">content-box</option><option value="border-box">border-box</option>';
      select.addEventListener('change',draw);label.append(select);controls.append(label);
    }
    host.append(section);
    const target=section.querySelector('.demo-target'),code=section.querySelector('.demo-code');
    function draw(){
      const values=Object.fromEntries([...controls.querySelectorAll('input')].map((input,i)=>[css.controls[i][0],Number(input.value)]));
      if(lesson.id==='lesson-15'){target.style.fontSize=values['font-size']+'px';target.style.lineHeight=values['line-height'];code.textContent='.card { font-size: '+values['font-size']+'px; line-height: '+values['line-height']+'; }'}
      if(lesson.id==='lesson-16'){const sizing=controls.querySelector('select').value;target.style.width='220px';target.style.border='4px solid var(--css)';target.style.boxSizing=sizing;target.style.padding=values.padding+'px';target.style.margin=values.margin+'px';code.textContent='.card { width: 220px; padding: '+values.padding+'px; margin: '+values.margin+'px; box-sizing: '+sizing+'; }'}
      if(lesson.id==='lesson-19'){target.style.display='flex';target.style.justifyContent=['flex-start','center','flex-end'][values.alignment];target.innerHTML='<span>First</span><span>Second</span>';code.textContent='.card { display: flex; justify-content: '+target.style.justifyContent+'; }'}
      if(lesson.id==='lesson-20'){target.style.display='grid';target.style.gridTemplateColumns='repeat('+values.columns+', 1fr)';target.innerHTML='<span>One</span><span>Two</span><span>Three</span><span>Four</span>';code.textContent='.card { display: grid; grid-template-columns: repeat('+values.columns+', 1fr); }'}
      if(lesson.id==='lesson-24'){target.style.transition='transform '+values.duration+'s';target.classList.toggle('demo-shift');code.textContent='.card { transition: transform '+values.duration+'s; }'}
    }
    draw();
  }else if(steps){
    const section=document.createElement('section');section.className='card demo';
    section.innerHTML='<h2>Step through an example</h2><p>Follow this prepared sequence one step at a time.</p><pre class="code-block"></pre><div class="row"><button class="button secondary">Step forward</button><button class="button ghost">Restart</button></div>';
    host.append(section);let step=0;const pre=section.querySelector('pre'),buttons=section.querySelectorAll('button');
    const draw=()=>pre.textContent=steps.slice(0,step+1).map((s,i)=>(i+1)+'. '+s).join('\n');
    buttons[0].addEventListener('click',()=>{step=Math.min(step+1,steps.length-1);draw()});
    buttons[1].addEventListener('click',()=>{step=0;draw()});draw();
  }
}
