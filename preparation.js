// Preparation is a view of the existing inventory. Locations change only on confirmation.
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sites=['Thuis','Trailer','Auto'];
const boxId=value=>/^Box [1-6]$/.test(value||'')?Number(value.slice(4)):null;
export function boxDestination(box,mode){
  if(mode==='current')return box.current_location||null;
  if(mode==='travel')return box.travel_location||'Trailer';
  const place=box.stalling;
  return sites.includes(place)?place:boxId(place)||place==='Trailer los'?'Trailer':null;
}
export function destination(item,data,mode){
  if(mode==='current')return {site:item.currentLocation||null,box:item.box||null};
  const value=mode==='storage'?item.storageLocation:item.travelLocation,id=boxId(value);
  if(id){const box=data.boxes.find(b=>b.id===id);return {site:box?boxDestination(box,mode):null,box:id};}
  // A broad site preserves the assigned box only when that box belongs at that site.
  const site=value==='Trailer los'?'Trailer':sites.includes(value)?value:null;
  const assigned=data.boxes.find(b=>b.id===item.box);
  return {site,box:value!=='Trailer los'&&site&&assigned&&boxDestination(assigned,mode)===site?item.box:null};
}
export const samePlace=(item,target)=>!!target.site&&item.currentLocation===target.site&&(item.box||null)===target.box;
export const fingerprint=(item,target)=>JSON.stringify([item.name,item.quantity,item.updatedAt,item.currentLocation,item.box,target.site,target.box]);
export function model(data,mode){
  const trip=(data.trips||[]).find(t=>t.active),context=mode==='travel'&&trip?`trip:${trip.id}`:mode==='travel'?'travel:unselected':'storage';
  const marks=new Map((data.preparationMarks||[]).filter(m=>m.context===context).map(m=>[m.item_id,m]));
  const rows=data.items.map(item=>{const target=destination(item,data,mode),mark=marks.get(item.id),excluded=mode==='travel'&&!!trip&&!!mark?.excluded,atPlace=samePlace(item,target),checked=!!mark?.checked&&mark.signature===fingerprint(item,target);return {item,target,excluded,atPlace,checked,done:atPlace&&checked};});
  const boxes=data.boxes.map(box=>{const contents=rows.filter(r=>(mode==='current'?r.item.box:r.target.box)===box.id&&!r.excluded),site=boxDestination(box,mode),atPlace=!!site&&box.current_location===site;return {box,contents,site,atPlace,missing:contents.filter(r=>!r.atPlace).length,unchecked:contents.filter(r=>!r.checked).length,done:atPlace&&contents.every(r=>r.done),relevant:mode==='current'||contents.length>0};});
  return {trip,context,rows,boxes};
}
export function moveBoxPlan(data,id,site){
  const box=data.boxes.find(b=>b.id===id);if(!box||!sites.includes(site))throw new Error('Kies een geldige locatie.');
  return {boxes:[{id,old_site:box.current_location,new_site:site}],items:data.items.filter(x=>x.box===id&&x.currentLocation===box.current_location).map(x=>({id:x.id,old_site:x.currentLocation,old_box:x.box||null,new_site:site,new_box:x.box||null}))};
}
export function moveItemPlan(item,target){if(!target.site)throw new Error('Vul eerst de bestemming in bij Artikel wijzigen.');return {boxes:[],items:[{id:item.id,old_site:item.currentLocation||null,old_box:item.box||null,new_site:target.site,new_box:target.box}]};}
export const reversePlan=plan=>({boxes:plan.boxes.map(x=>({...x,old_site:x.new_site,new_site:x.old_site})),items:plan.items.map(x=>({...x,old_site:x.new_site,old_box:x.new_box,new_site:x.old_site,new_box:x.old_box}))});

export function createPreparation({getState,store,header,nav,search,scopeBar,render,load,toast,openPhoto}){
  let onlyTodo=true,openBox=null,undo=null,busy=false;
  setInterval(()=>{if(getState().view==='home'&&!busy&&!document.hidden&&!document.activeElement?.matches('input,textarea,select'))load();},20000);
  const e=escapeHtml;
  const button=(action,id,text,extra='')=>`<button type="button" data-prep="${action}" data-id="${e(id)}" ${extra}>${text}</button>`;
  function get(){const s=getState();return {s,m:model(s.data,s.data.mode),prep:s.data.mode!=='current'};}
  function matches(r,s){const scope=s.filters.current,q=s.query.toLowerCase(),t=s.data.mode==='current'?{site:r.item.currentLocation,box:r.item.box}:r.target;return (!scope||(boxId(scope)?t.box===boxId(scope):t.site===scope))&&(!q||[r.item.name,r.item.description,r.item.note].join(' ').toLowerCase().includes(q));}
  function row(r,prep,m){const x=r.item,where=`${x.currentLocation||'Onbekend'}${x.box?` · Box ${x.box}`:' · los'}`,to=`${r.target.site||'Niet ingesteld'}${r.target.box?` · Box ${r.target.box}`:' · los'}`;return `<article class="prep-row">${button('article',x.id,`<strong>${e(x.name)}${x.quantity>1?` × ${x.quantity}`:''}</strong><span>Nu: ${e(where)}</span>${prep?`<span>Hoort: ${e(to)}</span>`:''}`)}${prep?`<p class="${r.done?'prep-ok':'prep-attention'}">${r.excluded?'Deze reis niet mee':!r.target.site?'Bestemming nog invullen':!r.atPlace?'Nog verplaatsen':!r.checked?'Op de juiste plek · inhoud nog controleren':'Op de juiste plek · gecontroleerd'}</p><div class="prep-actions">${r.excluded&&(x.box||x.currentLocation!=='Thuis')?button('leave-home',x.id,'Thuis apart gezet'):''}${!r.excluded&&r.target.site&&!r.atPlace?button('move-item',x.id,'Op bestemming gezet'):''}${!r.excluded?button('check-item',x.id,r.checked?'Controle ongedaan maken':'Inhoud gecontroleerd'):''}${m.trip&&getState().data.mode==='travel'?button('exclude',x.id,r.excluded?'Toch meenemen':'Deze reis niet mee'):''}</div>`:''}</article>`;}
  function results(){const {s,m,prep}=get(),eligible=m.rows.filter(r=>!r.excluded),relevant=m.boxes.filter(b=>b.relevant),remaining=eligible.filter(r=>!r.target.box&&!r.done).length;
    const cards=relevant.filter(b=>{const scope=s.filters.current;return (!prep||!onlyTodo||!b.done)&&(!scope||(boxId(scope)?b.box.id===boxId(scope):(prep?b.site:b.box.current_location)===scope))&&(!s.query||b.contents.some(r=>matches({...r,target:{...r.target,site:scope||r.target.site}}, {...s,filters:{...s.filters,current:''}}))||b.box.name.toLowerCase().includes(s.query.toLowerCase()));});
    const itemRows=m.rows.filter(r=>matches(r,s)&&(!prep||!r.excluded&&(!onlyTodo||!r.done))),excluded=m.rows.filter(r=>r.excluded&&matches(r,s));
    return `${prep?`<section class="prep-progress"><strong>${relevant.filter(b=>b.done).length} van ${relevant.length} boxen klaar · ${remaining} losse artikelen nog doen</strong><p>Klaar = op de bedoelde plek én inhoud gecontroleerd.</p>${s.data.mode==='travel'?`<p>${m.trip?`Reis: ${e(m.trip.name)}`:'Geen actieve reis. Kies een reis in Beheer → Reizen om controles en uitzonderingen te bewaren.'}</p>`:''}<div class="prep-actions">${button('todo','', 'Nog doen',`aria-pressed="${onlyTodo}"`)}${button('all','','Alles',`aria-pressed="${!onlyTodo}"`)}${s.data.mode==='storage'?button('new-round','','Nieuwe stallingsronde'):''}</div></section>`:''}${undo?`<aside class="prep-undo">${e(undo.label)} ${button('undo','','Ongedaan maken')}</aside>`:''}<h2>Je boxen</h2><section class="box-grid prep-boxes">${cards.map(b=>{const p=b.box.photos?.find(p=>p.url);return `<article class="prep-box"><button data-prep="box" data-id="${b.box.id}" class="prep-box-open"><small>BOX ${b.box.id}</small><div class="prep-photo">${p?`<img src="${e(p.url)}" alt="${e(b.box.name)}">`:'Nog geen boxfoto'}</div><h3>${e(b.box.name)}</h3><p>${b.contents.length} artikelen · Nu: ${e(b.box.current_location||'Onbekend')}</p>${prep?`<p>Hoort: ${e(b.site||'Niet ingesteld')}</p><p>${b.atPlace?'Box op de juiste plek':`Box nog verplaatsen vanuit ${e(b.box.current_location||'onbekend')}`}</p><p>${b.missing} artikelen niet op hun plek · ${b.unchecked} nog controleren</p>`:''}</button>${prep?`<div class="prep-actions">${!b.atPlace&&b.site?button('move-box',b.box.id,`Box naar ${e(b.site)} gezet`):''}${button('check-box',b.box.id,'Inhoud controleren')}</div>`:''}</article>`}).join('')||'<p>Geen boxen in deze selectie. Kies Alles om ook afgeronde boxen te zien.</p>'}</section>${openBox?`<section class="prep-open"><h2>Inhoud Box ${openBox}</h2>${button('close-box','','Sluiten')}${m.rows.filter(r=>(prep?r.target.box:r.item.box)===openBox&&!r.excluded).map(r=>row(r,prep,m)).join('')||'<p>Geen artikelen in deze indeling.</p>'}${button('box-details',openBox,'Boxfoto en gegevens wijzigen')}</section>`:''}<details class="prep-overview" open><summary>Wat ligt waar? (${itemRows.length})</summary><p>De filters bovenaan gelden ook voor dit overzicht.</p>${itemRows.filter(r=>!(prep?r.target.box:r.item.box)).map(r=>row(r,prep,m)).join('')}<details><summary>Artikelen in boxen (${itemRows.filter(r=>prep?r.target.box:r.item.box).length})</summary>${itemRows.filter(r=>prep?r.target.box:r.item.box).map(r=>row(r,prep,m)).join('')}</details>${!itemRows.length?'<p>Geen openstaande artikelen voor deze selectie.</p>':''}</details>${excluded.length?`<details><summary>Deze reis niet mee (${excluded.length})</summary>${excluded.map(r=>row(r,prep,m)).join('')}</details>`:''}`;
  }
  function home(){const {s,m,prep}=get();if(openBox){const b=s.data.boxes.find(b=>Number(b.id)===openBox);if(b){const photos=(b.photos||[]).filter(p=>p.url);return `${header(`Box ${openBox}`)}<main class="box-page"><section class="box-page-gallery" aria-label="Boxfoto’s">${photos.length?`<div class="box-page-slides">${photos.map(p=>button('box-photo',p.url,`<img src="${e(p.url)}" alt="Foto van Box ${openBox} vergroten">`)).join('')}</div>${photos.length>1?`<div class="box-page-controls">${button('photo-prev','','‹','aria-label="Vorige foto"')}<span class="box-page-dots">${photos.map((p,i)=>button('photo-index',i,'●',`aria-label="Foto ${i+1}" aria-pressed="${i===0}"`)).join('')}</span>${button('photo-next','','›','aria-label="Volgende foto"')}</div>`:''}`:'<div class="box-page-empty">Nog geen boxfoto</div>'}</section><h2>${e(b.name)}</h2>${b.description?`<p>${e(b.description)}</p>`:''}<p>Nu: ${e(b.current_location||'Onbekend')}</p><section class="prep-open"><h2>Inhoud Box ${openBox}</h2>${m.rows.filter(r=>(prep?r.target.box:r.item.box)===openBox&&!r.excluded).map(r=>row(r,prep,m)).join('')||'<p>Geen artikelen in deze indeling.</p>'}${button('box-details',openBox,'Boxfoto en gegevens wijzigen')}</section></main>${nav()}`;}}return `${header()}<section class="prep-modes"><p>Overzicht & voorbereiding · versie 23</p><div>${[['current','Overzicht'],['storage','Stalling voorbereiden'],['travel','Vertrek voorbereiden']].map(([id,label])=>button('mode',id,label,`aria-pressed="${s.data.mode===id}"`)).join('')}</div></section>${scopeBar().replace('Toon inhoud van',s.data.mode==='current'?'Toon huidige locatie':'Toon bestemming')}${search()}<main id="prep-results">${results()}</main>${nav()}`;}
  async function marks(rows,values){const {s,m}=get();if(s.data.mode==='travel'&&!m.trip)throw new Error('Maak eerst een reis actief via Beheer → Reizen.');await store.request('preparation_marks?on_conflict=context,item_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.map(r=>({context:m.context,item_id:r.item.id,...values,signature:fingerprint(r.item,r.target)})))});}
  async function move(plan,label){await store.request('rpc/preparation_move',{method:'POST',body:JSON.stringify({plan})});undo={plan:reversePlan(plan),label};}
  function bind(){
    if(getState().view==='trips'){
      const s=getState(),m=model(s.data,'travel'),host=document.querySelector('.active-trip');
      if(host&&m.trip){const rows=m.rows.filter(r=>!r.excluded),progress=host.querySelector('.pack-progress'),list=host.querySelector('.trip-packlist');
        if(progress)progress.textContent=`${rows.filter(r=>r.done).length} van ${rows.length} artikelen op de juiste plek én gecontroleerd`;
        host.querySelector(':scope > .safety-note')?.remove();
        if(list){list.innerHTML=button('open-preparation','','Open vertrekvoorbereiding');list.querySelector('button').onclick=async event=>{event.stopPropagation();await store.setMode('travel');s.data.mode='travel';s.view='home';render();};}
      }
    }
    if(getState().view!=='home')return;
    const track=document.querySelector('.box-page-slides');if(track)track.onscroll=()=>{const index=Math.round(track.scrollLeft/track.clientWidth);document.querySelectorAll('[data-prep="photo-index"]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));};
    document.querySelectorAll('[data-scope]').forEach(b=>b.onclick=event=>{event.stopPropagation();getState().filters.current=b.dataset.scope;openBox=null;render();});
    const input=document.querySelector('#search');if(input)input.oninput=event=>{getState().query=event.target.value;document.querySelector('#prep-results').innerHTML=results();};
    const app=document.querySelector('#app'),old=app.onclick;app.onclick=async event=>{const b=event.target.closest('[data-prep]');if(!b)return old(event);event.stopPropagation();if(busy)return;const {s,m}=get(),id=b.dataset.id,action=b.dataset.prep,r=m.rows.find(r=>r.item.id===id);try{
      if(action==='box-photo'){openPhoto(id);return;}
      if(action==='photo-prev'||action==='photo-next'||action==='photo-index'){const track=document.querySelector('.box-page-slides'),index=Math.round(track.scrollLeft/track.clientWidth),target=action==='photo-index'?Number(id):index+(action==='photo-next'?1:-1);track.scrollTo({left:Math.max(0,Math.min(track.children.length-1,target))*track.clientWidth,behavior:'smooth'});return;}
      if(action==='mode'){await store.setMode(id);s.data.mode=id;openBox=null;render();return;}
      if(action==='todo'||action==='all'){onlyTodo=action==='todo';render();return;}
      if(action==='box'||action==='close-box'){openBox=action==='box'?Number(id):null;render();window.scrollTo(0,0);return;}
      if(action==='article'){s.editing=id;s.view='detail';render();return;}
      if(action==='box-details'){s.filters.box=id;s.filters.current='';s.view='inventory';render();return;}
      busy=true;b.disabled=true;
      if(action==='move-item')await move(moveItemPlan(r.item,r.target),'Artikel verplaatst.');
      if(action==='move-box'){const box=m.boxes.find(x=>x.box.id===Number(id));if(m.rows.some(r=>r.excluded&&r.item.box===box.box.id&&r.item.currentLocation===box.box.current_location))throw new Error('Deze box bevat nog een artikel dat deze reis niet meegaat. Zet dat eerst apart via het overzicht Deze reis niet mee.');await move(moveBoxPlan(s.data,box.box.id,box.site),'Box en aanwezige inhoud verplaatst.');}
      if(action==='leave-home')await move(moveItemPlan(r.item,{site:'Thuis',box:null}),'Artikel thuis apart gezet.');
      if(action==='new-round'){await store.request('preparation_marks?context=eq.storage',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({checked:false})});}
      if(action==='undo'){await store.request('rpc/preparation_move',{method:'POST',body:JSON.stringify({plan:undo.plan})});undo=null;}
      if(action==='check-item')await marks([r],{checked:!r.checked});
      if(action==='check-box'){const box=m.boxes.find(x=>x.box.id===Number(id));openBox=box.box.id;busy=false;render();window.scrollTo(0,0);toast('Controleer de artikelen één voor één; de box wordt vanzelf klaar.');return;}
      if(action==='exclude')await marks([r],{excluded:!r.excluded,checked:false});
      await load();
    }catch(err){toast(err.message);b.disabled=false;}finally{busy=false;}};
  }
  return {home,bind,route:()=>({page:'start',box:openBox,todo:onlyTodo}),restore:r=>{openBox=r?.box||null;onlyTodo=r?.todo!==false;},normalize(){}};
}
