// Real browser history; only view state is stored, never form values or credentials.
export function createNavigation({getState,preparation,render,store}){
  let current=null,max=0,baseline='',restoring=false,rebounding=false,saved=false;
  const session=history.state?.daktent24?.session||crypto.randomUUID();
  const formValue=()=>JSON.stringify([...document.querySelectorAll('form:not(#login-form)')].map(f=>[f.id,[...new FormData(f)].map(([k,v])=>[k,v instanceof File?(v.name?[v.name,v.size,v.lastModified]:''):v])]));
  const dirty=()=>!!baseline&&baseline!==formValue()&&!saved;
  function snapshot(){const s=getState();return {view:s.view,mode:s.data?.mode||'current',filters:{...s.filters},query:s.query,editing:typeof s.editing==='string'?s.editing:s.editing?.id||null,trip:s.editingTrip?.id||null,prep:preparation.route(),scroll:window.scrollY};}
  const key=r=>JSON.stringify([r.view,r.mode,r.editing,r.trip,r.prep.page,r.prep.box,r.filters.box]);
  function apply(r){const s=getState();s.view=r.view;s.filters={...r.filters};s.query=r.query||'';s.editing=s.data.items.find(x=>x.id===r.editing)||null;s.editingTrip=s.data.trips?.find(x=>x.id===r.trip)||null;preparation.restore(r.prep);s.data.mode=r.mode;store.setMode(r.mode);}
  function url(r){const p=new URLSearchParams({pagina:r.view==='home'?r.prep.page:r.view});if(r.prep.box&&r.view==='home')p.set('box',r.prep.box);if(r.editing)p.set('artikel',r.editing);return `${location.pathname}${location.search}#${p}`;}
  function write(entry,push=false){history[push?'pushState':'replaceState']({daktent24:entry},'',url(entry.route));}
  function overlay(value){document.querySelector('.lightbox')?.remove();if(!value)return;const d=document.createElement('div');d.className='lightbox';d.setAttribute('role','dialog');d.setAttribute('aria-label','Vergrote foto');const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Foto sluiten');const img=document.createElement('img');img.src=value;img.alt='Vergrote foto';d.append(close,img);d.onclick=e=>{if(e.target===d||e.target===close)back();};document.body.append(d);close.focus();}
  function controls(){document.querySelector('.history-controls')?.remove();const h=document.querySelector('.topbar');if(!h||!current)return;const bar=document.createElement('div');bar.className='history-controls';bar.innerHTML=`<button type="button" data-history="back" ${current.index===0?'disabled':''}>‹ Terug</button><button type="button" data-history="forward" ${current.index>=max?'disabled':''}>Vooruit ›</button>`;h.after(bar);}
  function beforeRender(){if(!getState().data)return true;
    if(!current){const prior=history.state?.daktent24;if(prior?.session===session){current=prior;max=Math.max(prior.index,Number(sessionStorage.getItem('daktent-history-'+session)||0));apply(prior.route);}else{
      const params=new URLSearchParams(location.hash.slice(1)),page=params.get('pagina'),s=getState();
      if(['start','locations','storage','travel'].includes(page)){s.view='home';preparation.restore({page,box:/^[1-6]$/.test(params.get('box')||'')?Number(params.get('box')):null,todo:true});preparation.normalize();}
      else if(['inventory','check','settings','loading','packing','safety','trips','maintenance'].includes(page))s.view=page;
      else if(page==='detail'){const item=s.data.items.find(x=>x.id===params.get('artikel'));if(item){s.view='detail';s.editing=item;}}
      current={session,index:0,route:snapshot()};write(current);
    }return true;}
    if(restoring)return true;
    const next=snapshot();if(key(next)!==key(current.route)){
      if(dirty()&&!confirm('Je hebt niet-opgeslagen wijzigingen. Deze pagina verlaten en de wijzigingen weggooien?')){apply(current.route);return false;}
      current={session,index:current.index+1,route:{...next,scroll:0}};max=current.index;sessionStorage.setItem('daktent-history-'+session,String(max));write(current,true);window.scrollTo(0,0);
    }else{current={...current,route:{...next,scroll:current.route.scroll}};write(current);}
    return true;
  }
  function afterRender(){baseline=formValue();saved=false;controls();if(current?.photo)overlay(current.photo);}
  function update(){if(!current||restoring||rebounding)return;const next=snapshot();if(key(next)!==key(current.route))return;current={...current,route:next};write(current);}
  function back(){if(current?.index>0)history.back();}
  function forward(){if(current&&current.index<max)history.forward();}
  window.addEventListener('popstate',event=>{
    const target=event.state?.daktent24;if(rebounding){rebounding=false;return;}if(!target||target.session!==session)return;
    const samePage=key(target.route)===key(current.route);
    if(!samePage&&dirty()&&!confirm('Je hebt niet-opgeslagen wijzigingen. Deze pagina verlaten en de wijzigingen weggooien?')){rebounding=true;history.go(current.index-target.index);return;}
    const overlayOnly=samePage&&(!!current.photo||!!target.photo);current=target;
    if(overlayOnly){overlay(target.photo);controls();return;}
    restoring=true;apply(target.route);render();restoring=false;overlay(target.photo);requestAnimationFrame(()=>window.scrollTo(0,target.route.scroll||0));
  });
  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;
    if(b.dataset.history||b.dataset.action==='back'){event.preventDefault();event.stopImmediatePropagation();b.dataset.history==='forward'?forward():back();}
    // Start always means the start page, including when opened from a preparation page.
    else if(b.dataset.view==='home'){preparation.restore({page:'start',box:null,todo:true});if(getState().data)getState().data.mode='current';}
  },true);
  document.addEventListener('input',update);document.addEventListener('change',update);
  let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(update,100);},{passive:true});
  window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&current?.photo)back();});
  return {beforeRender,afterRender,update,back,forward,saved(){saved=true;},openPhoto(src){if(!current)return;update();current={session,index:current.index+1,route:{...current.route},photo:src};max=current.index;sessionStorage.setItem('daktent-history-'+session,String(max));write(current,true);overlay(src);controls();}};
}
