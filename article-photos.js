// Only the article-detail photo area. Uses the existing store/photo functions.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=p=>p?.data||p?.url||'';
const css=`
.article-photos{margin-bottom:22px;min-width:0}.article-photos [hidden]{display:none!important}
.article-photos .ap-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px}.article-photos .ap-count{font-size:12px;color:var(--muted)}
.article-photos button,.article-photos .ap-file-label{font:inherit;position:static;min-width:0;cursor:pointer;color:inherit}
.article-photos .ap-edit{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--pink)}.article-photos .ap-edit svg{width:20px;height:20px}
.article-photos .ap-slides{display:flex;height:clamp(280px,76vw,350px);max-height:350px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:16px;background:#101014;overscroll-behavior-x:contain}.article-photos .ap-slides::-webkit-scrollbar{display:none}
.article-photos .ap-slide{flex:0 0 100%;width:100%;height:100%;min-height:0;scroll-snap-align:start;border:0;background:transparent;padding:0;display:block;overflow:hidden;cursor:zoom-in}
.article-photos .ap-slide img{display:block;width:100%;height:100%;min-height:0;object-fit:cover;object-position:center}.article-photos .ap-unavailable{padding:18px;color:var(--muted);text-align:center;font-size:14px}
.article-photos .ap-empty{padding:36px 16px;text-align:center;border:1px dashed var(--line);border-radius:16px;color:var(--muted)}
.article-photos .ap-pagination{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:7px}.article-photos .ap-arrow{width:44px;height:44px;border:0;border-radius:10px;background:var(--card);font-size:24px}.article-photos .ap-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:0;flex:0 1 auto}.article-photos .ap-dot{width:30px;height:36px;border:0;background:transparent;padding:10px;display:grid;place-items:center}.article-photos .ap-dot:before{content:'';width:7px;height:7px;border-radius:50%;background:#72727a}.article-photos .ap-dot[aria-current=true]:before{background:var(--pink);width:10px;height:10px}
.article-photos .ap-manager{margin-top:14px;border:1px solid var(--line);border-radius:14px;background:var(--card);padding:12px}.article-photos .ap-manager h3{font-size:17px}.article-photos .ap-manage-row{display:grid;grid-template-columns:60px minmax(0,1fr);gap:10px;align-items:center;border-top:1px solid var(--line);padding:12px 0}.article-photos .ap-thumb{width:60px;height:70px;object-fit:contain;background:#101014;border-radius:8px}.article-photos .ap-commands{display:flex;flex-wrap:wrap;gap:7px}.article-photos .ap-command{border:1px solid var(--line);border-radius:9px;padding:9px;min-height:44px;background:#27272f;font-size:12px}.article-photos .ap-main-label{display:block;margin-bottom:6px;color:var(--pink);font-size:12px}.article-photos .ap-message{font-size:13px;overflow-wrap:anywhere;margin:8px 0 0}.article-photos button:disabled{cursor:default;opacity:.45}.article-photos[aria-busy=true] button{cursor:wait}.article-photos button:focus-visible{outline:2px solid var(--pink);outline-offset:2px}
`;
export function createArticlePhotos({getItem,store,reload,toast,openPhoto}){
  let activeId=null,managerOpen=false,busy=false;
  function style(){if(document.getElementById('article-photo-styles'))return;const element=document.createElement('style');element.id='article-photo-styles';element.textContent=css;document.head.append(element);}
  function markup(item){style();if(activeId!==item.id||!document.querySelector('.article-photos')){activeId=item.id;managerOpen=false;}
    const photos=item.photos||[],main=photos.find(p=>src(p))||photos[0];
    // Inventory uses the first available photo, so the detail view starts on that same photo.
    const visible=main?[main,...photos.filter(p=>p!==main)]:[];
    return `<section class="article-photos" aria-label="Artikelfoto’s" aria-busy="false"><div class="ap-toolbar"><span class="ap-count" aria-live="polite">${photos.length?`Foto 1 van ${photos.length}`:'Nog geen foto'}</span><button class="ap-edit" type="button" aria-label="Foto’s beheren" aria-controls="article-photo-manager" aria-expanded="${managerOpen}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 5l5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z"/></svg></button></div>${visible.length?`<div class="ap-slides" aria-label="Foto’s doorbladeren">${visible.map((p,i)=>`<button class="ap-slide" type="button" data-ap-index="${i}" data-ap-photo="${escape(p.id)}" aria-label="Foto ${i+1} vergroten">${src(p)?`<img src="${escape(src(p))}" alt="${escape(item.name)} — foto ${i+1}">`:'<span class="ap-unavailable">Foto niet beschikbaar</span>'}</button>`).join('')}</div><div class="ap-pagination" ${visible.length<2?'hidden':''}><button class="ap-arrow" data-ap-step="-1" type="button" aria-label="Vorige foto">‹</button><div class="ap-dots">${visible.map((p,i)=>`<button class="ap-dot" type="button" data-ap-dot="${i}" aria-label="Toon foto ${i+1}" aria-current="${i===0}"></button>`).join('')}</div><button class="ap-arrow" data-ap-step="1" type="button" aria-label="Volgende foto">›</button></div>`:'<div class="ap-empty">Dit artikel heeft nog geen foto. Voeg er één toe via het potloodicoon.</div>'}<section id="article-photo-manager" class="ap-manager" ${managerOpen?'':'hidden'}><h3>Foto’s beheren</h3><button class="ap-command" type="button" data-ap-add>Foto uit telefoon toevoegen</button><input type="file" accept="image/*" data-ap-file hidden>${photos.map(p=>`<div class="ap-manage-row">${src(p)?`<img class="ap-thumb" src="${escape(src(p))}" alt="Fotominiatuur">`:'<span>Geen beeld</span>'}<div>${p===main?'<span class="ap-main-label">Hoofdfoto</span>':''}<div class="ap-commands">${p!==main?`<button class="ap-command" type="button" data-ap-cover="${escape(p.id)}">Als hoofdfoto</button>`:''}<button class="ap-command" type="button" data-ap-replace="${escape(p.id)}">Vervangen</button><button class="ap-command" type="button" data-ap-delete="${escape(p.id)}">Verwijderen</button></div></div></div>`).join('')}<button class="ap-command" type="button" data-ap-close>Fotobeheer sluiten</button><p class="ap-message" role="status"></p></section></section>`;
  }
  function bind(item){const host=document.querySelector('.article-photos');if(!host)return;
    const photos=item.photos||[],main=photos.find(p=>src(p))||photos[0],visible=main?[main,...photos.filter(p=>p!==main)]:[],slides=host.querySelector('.ap-slides'),manager=host.querySelector('.ap-manager'),edit=host.querySelector('.ap-edit'),file=host.querySelector('[data-ap-file]');let index=0,replaceId=null;
    const toggle=open=>{managerOpen=open;manager.hidden=!open;edit.setAttribute('aria-expanded',String(open));if(open)manager.querySelector('button')?.focus();else edit.focus();};
    function indicate(){host.querySelector('.ap-count').textContent=`Foto ${index+1} van ${visible.length}`;host.querySelectorAll('[data-ap-dot]').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));}
    function show(i){index=Math.max(0,Math.min(visible.length-1,i));slides.scrollTo({left:slides.clientWidth*index,behavior:'smooth'});indicate();}
    if(slides){slides.onscroll=()=>{index=Math.round(slides.scrollLeft/(slides.clientWidth||1));indicate();};slides.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}};}
    host.querySelectorAll('.ap-slide img').forEach(img=>img.onerror=()=>{const text=document.createElement('span');text.className='ap-unavailable';text.textContent='Foto kon niet worden geladen. Open het artikel opnieuw om te proberen.';img.replaceWith(text);});
    async function run(task){if(busy)return;busy=true;host.setAttribute('aria-busy','true');host.querySelectorAll('button,input').forEach(x=>x.disabled=true);try{await task();await reload();}catch(error){const msg=host.querySelector('.ap-message');if(msg)msg.textContent=error.message;toast(error.message);}finally{busy=false;host.setAttribute('aria-busy','false');host.querySelectorAll('button,input').forEach(x=>x.disabled=false);}}
    host.onclick=event=>{const b=event.target.closest('button');if(!b)return;event.stopPropagation();if(busy)return;
      if(b===edit)toggle(manager.hidden);
      if(b.hasAttribute('data-ap-close'))toggle(false);
      if(b.hasAttribute('data-ap-add')){replaceId=null;file.value='';file.click();}
      if(b.dataset.apReplace){replaceId=b.dataset.apReplace;file.value='';file.click();}
      if(b.dataset.apIndex!==undefined){const p=visible[Number(b.dataset.apIndex)];if(src(p))openPhoto(src(p));}
      if(b.dataset.apDot!==undefined)show(Number(b.dataset.apDot));
      if(b.dataset.apStep)show(index+Number(b.dataset.apStep));
      if(b.dataset.apCover)run(async()=>{await store.setItemCover(item.id,b.dataset.apCover);toast('Hoofdfoto aangepast');});
      if(b.dataset.apDelete&&confirm('Deze foto verwijderen?'))run(async()=>{await store.deletePhoto(item.id,b.dataset.apDelete);toast('Foto verwijderd');});
    };
    file.onchange=()=>{const chosen=file.files[0];if(!chosen)return;const oldId=replaceId;run(async()=>{
      if(chosen.type&&!chosen.type.startsWith('image/'))throw new Error('Kies een afbeelding.');
      const oldPhotos=getItem(item.id)?.photos||[],oldIds=new Set(oldPhotos.map(p=>p.id)),oldMain=oldPhotos.find(p=>src(p))||oldPhotos[0];
      await store.addPhoto(item.id,chosen);
      if(oldId){const latest=await store.snapshot(),updated=latest.items.find(x=>x.id===item.id),added=updated?.photos.find(p=>!oldIds.has(p.id));if(!added)throw new Error('Nieuwe foto niet gevonden. De oorspronkelijke foto is behouden.');if(oldMain?.id===oldId)await store.setItemCover(item.id,added.id);await store.deletePhoto(item.id,oldId);}
      toast(oldId?'Foto vervangen':'Foto toegevoegd');
    });};
  }
  return {markup,bind};
}
