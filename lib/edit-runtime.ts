/**
 * Runtime d'édition WYSIWYG injecté dans l'iframe d'aperçu (mode ?edit=1).
 * Script vanilla autonome (PAS de logique par composant) : il s'appuie sur les
 * annotations `data-sg-path` (texte) et `data-sg-img` (image) posées dans les
 * templates. Il communique avec la fenêtre parente (éditeur) par postMessage.
 *
 * Deux modes pilotés par le parent (sg:mode) :
 *  - 'edit' : cadres + étiquettes TEXTE/PHOTO permanents, édition inline / swap photo.
 *  - 'note' : on estompe les cadres ; un clic capture l'élément cible + la position
 *    et l'envoie au parent (sg:note) ; les pins existants (sg:pins) sont dessinés.
 *
 * React n'est pas réactif (le bundle lit window.__SITE_CONTENT__ une seule fois) :
 * en mode édition on mute donc le DOM directement ; la vérité est côté serveur.
 *
 * Protocole :
 *   iframe → parent : {type:'sg:ready'} | {type:'sg:editText', ...} | {type:'sg:editPhoto', ...} | {type:'sg:note', target}
 *   parent → iframe : {type:'sg:setValue'} | {type:'sg:setPhoto'} | {type:'sg:mode', mode} | {type:'sg:pins', pins}
 */

function safeJson(obj: unknown): string {
  return JSON.stringify(obj ?? {}).replace(/</g, "\\u003c");
}

export type EditableFieldSpec = { path: string; type: string; maxLen?: number };

const RUNTIME = String.raw`
(function(){
  var ORIGIN = window.location.origin;
  var FIELDS = window.__SG_FIELDS__ || [];
  var mode = 'edit';      // 'edit' | 'note'
  var pins = [];          // [{n, target}]
  var leaves = [];        // éléments contentEditable (pour basculer en mode note)
  function send(msg){ try{ parent.postMessage(msg, ORIGIN); }catch(e){} }
  function esc(s){ return String(s).replace(/[\\^$.*+?()[\]{}|]/g,'\\$&'); }
  function cssEsc(s){ return String(s).replace(/["\\]/g,'\\$&'); }
  function debounce(fn,ms){ var t; return function(){ var a=arguments,c=this; clearTimeout(t); t=setTimeout(function(){fn.apply(c,a);},ms); }; }
  function specFor(path){ for (var i=0;i<FIELDS.length;i++){ var re=new RegExp('^'+FIELDS[i].path.split('[]').map(esc).join('\\[\\d+\\]')+'$'); if(re.test(path)) return FIELDS[i]; } return null; }

  var style = document.createElement('style');
  style.textContent =
    'html.sg-on [data-sg-path],html.sg-on [data-sg-img]{outline:1.5px dashed rgba(37,99,235,.6);outline-offset:2px;border-radius:3px;pointer-events:auto}'+
    'html.sg-on [data-sg-path]:hover,html.sg-on [data-sg-img]:hover{outline:2px solid #2563eb}'+
    'html.sg-note [data-sg-path],html.sg-note [data-sg-img]{outline-color:rgba(37,99,235,.18)!important}'+
    'html.sg-note *{cursor:crosshair!important}'+
    '#sg-ov{position:absolute;left:0;top:0;width:0;height:0;z-index:2147483000;pointer-events:none}'+
    '#sg-ov .sg-badge{position:absolute;background:#2563eb;color:#fff;font:700 10px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;padding:3px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:translateY(-100%)}'+
    '#sg-ov .sg-pin{position:absolute;width:26px;height:26px;background:#e5412a;color:#fff;font:800 12px/1 ui-sans-serif,system-ui;display:grid;place-items:center;border-radius:50% 50% 50% 0;transform:translate(-50%,-100%) rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.4);outline:2px solid #fff}'+
    '#sg-ov .sg-pin span{transform:rotate(45deg)}';
  (document.head||document.documentElement).appendChild(style);
  document.documentElement.classList.add('sg-on');

  var ov = document.createElement('div'); ov.id='sg-ov';

  function buildSelector(el){
    if(!el||el===document.body) return 'body';
    var parts=[], depth=0;
    while(el&&el.nodeType===1&&el!==document.body&&depth<6){
      var pp=el.getAttribute&&(el.getAttribute('data-sg-path')||el.getAttribute('data-sg-img'));
      if(pp){ var k=el.getAttribute('data-sg-path')?'path':'img'; parts.unshift('[data-sg-'+k+'="'+cssEsc(pp)+'"]'); break; }
      if(el.id){ parts.unshift('#'+el.id); break; }
      var tag=el.tagName.toLowerCase(), i=1, sib=el;
      while((sib=sib.previousElementSibling)){ if(sib.tagName===el.tagName) i++; }
      parts.unshift(tag+':nth-of-type('+i+')'); el=el.parentElement; depth++;
    }
    return parts.join('>');
  }
  function labelFor(el){
    if(!el) return 'élément';
    if(el.getAttribute&&el.getAttribute('data-sg-img')) return 'photo';
    var tag=el.tagName?el.tagName.toLowerCase():'';
    if(tag==='img') return 'photo';
    var txt=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,32);
    if(tag==='a'||tag==='button') return 'bouton'+(txt?' « '+txt+' »':'');
    if(txt) return '« '+txt+' »';
    return tag||'élément';
  }
  function locate(pin){
    // Pin EXACTEMENT au point cliqué (coordonnées document), jamais recollé à un élément.
    var t=pin.target; if(!t) return null;
    return {x:(t.xPct/100)*document.documentElement.scrollWidth,y:(t.yPct/100)*document.documentElement.scrollHeight};
  }
  function clearOv(){ while(ov.firstChild) ov.removeChild(ov.firstChild); }
  function draw(){
    clearOv();
    if(mode==='note'){
      for(var i=0;i<pins.length;i++){ var p=locate(pins[i]); if(!p) continue;
        var d=document.createElement('div'); d.className='sg-pin'; var s=document.createElement('span'); s.textContent=pins[i].n; d.appendChild(s);
        d.style.left=p.x+'px'; d.style.top=p.y+'px'; ov.appendChild(d); }
      return;
    }
    var els=document.querySelectorAll('[data-sg-path],[data-sg-img]');
    for(var j=0;j<els.length;j++){ var el=els[j], r=el.getBoundingClientRect(); if(r.width===0&&r.height===0) continue;
      var b=document.createElement('div'); b.className='sg-badge'; b.textContent=el.getAttribute('data-sg-img')?'PHOTO ↺':'TEXTE ✎';
      b.style.left=(r.left+window.scrollX)+'px'; b.style.top=(r.top+window.scrollY-3)+'px'; ov.appendChild(b); }
  }
  var redraw = debounce(draw, 120);

  function setupText(el){
    if(el.__sg) return; el.__sg=1;
    var path=el.getAttribute('data-sg-path'); var spec=specFor(path);
    var multi=document.querySelectorAll('[data-sg-path="'+cssEsc(path)+'"]').length>1;
    var panel=el.getAttribute('data-sg-edit')==='panel'||multi;
    if(panel){
      el.addEventListener('click',function(e){ if(mode!=='edit') return; e.preventDefault(); e.stopPropagation();
        var r=el.getBoundingClientRect();
        send({type:'sg:editText',path:path,value:el.textContent,panel:true,fieldType:spec?spec.type:'textarea',maxLen:spec?spec.maxLen:null,rect:{top:r.top,left:r.left,width:r.width,height:r.height}}); });
    } else {
      leaves.push(el); el.setAttribute('contenteditable','true');
      el.addEventListener('keydown',function(e){ if(e.key==='Enter'&&spec&&spec.type==='text'){ e.preventDefault(); el.blur(); }});
      var emit=function(){ var v=el.textContent; if(spec&&spec.maxLen&&v.length>spec.maxLen) v=v.slice(0,spec.maxLen); send({type:'sg:editText',path:path,value:v,leaf:true}); redraw(); };
      el.addEventListener('input',debounce(emit,400)); el.addEventListener('blur',emit);
    }
  }
  function setupImg(el){
    if(el.__sg) return; el.__sg=1; var path=el.getAttribute('data-sg-img');
    el.addEventListener('click',function(e){ if(mode!=='edit') return; e.preventDefault(); e.stopPropagation();
      var r=el.getBoundingClientRect(); send({type:'sg:editPhoto',path:path,rect:{top:r.top,left:r.left,width:r.width,height:r.height}}); });
  }
  function setEditable(on){ for(var i=0;i<leaves.length;i++){ if(on) leaves[i].setAttribute('contenteditable','true'); else leaves[i].removeAttribute('contenteditable'); } }
  function scan(){ var t=document.querySelectorAll('[data-sg-path]'); for(var i=0;i<t.length;i++) setupText(t[i]); var m=document.querySelectorAll('[data-sg-img]'); for(var j=0;j<m.length;j++) setupImg(m[j]); redraw(); }

  // Clic en mode note : capture cible + position, n'agit jamais en mode edit.
  document.addEventListener('click',function(e){
    if(mode!=='note') return; e.preventDefault(); e.stopPropagation();
    var el=e.target; var ann=el.closest?el.closest('[data-sg-path],[data-sg-img]'):null;
    var aim=ann||el;
    var path=ann?(ann.getAttribute('data-sg-path')||ann.getAttribute('data-sg-img')):undefined;
    var docW=document.documentElement.scrollWidth, docH=document.documentElement.scrollHeight;
    var rr=aim.getBoundingClientRect&&aim.getBoundingClientRect();
    var ox=rr&&rr.width?(e.clientX-rr.left)/rr.width:0.5; var oy=rr&&rr.height?(e.clientY-rr.top)/rr.height:0.5;
    ox=ox<0?0:ox>1?1:ox; oy=oy<0?0:oy>1?1:oy;
    send({type:'sg:note',target:{path:path||undefined,cssSelector:buildSelector(aim),label:labelFor(aim),xPct:(e.pageX/docW)*100,yPct:(e.pageY/docH)*100,offset:{dx:ox,dy:oy}}});
  }, true);
  // En mode edit, un clic sur un lien ne navigue pas.
  document.addEventListener('click',function(e){ if(mode!=='edit') return; var a=e.target&&e.target.closest&&e.target.closest('a'); if(a) e.preventDefault(); }, true);

  window.addEventListener('message',function(e){
    if(e.origin!==ORIGIN) return; var d=e.data||{};
    if(d.type==='sg:setValue'){ var ns=document.querySelectorAll('[data-sg-path="'+cssEsc(d.path)+'"]'); for(var i=0;i<ns.length;i++){ ns[i].textContent=d.value; var h=ns[i].getAttribute&&ns[i].getAttribute('href'); if(h&&h.indexOf('mailto:')===0) ns[i].setAttribute('href','mailto:'+d.value); } redraw(); }
    else if(d.type==='sg:setPhoto'){ var ms=document.querySelectorAll('[data-sg-img="'+cssEsc(d.path)+'"]'); for(var k=0;k<ms.length;k++){ if(ms[k].tagName==='IMG') ms[k].src=d.url; else ms[k].style.backgroundImage='url('+d.url+')'; } redraw(); }
    else if(d.type==='sg:mode'){ mode=d.mode==='note'?'note':'edit'; document.documentElement.classList.toggle('sg-note',mode==='note'); setEditable(mode==='edit'); draw(); }
    else if(d.type==='sg:pins'){ pins=Array.isArray(d.pins)?d.pins:[]; if(mode==='note') draw(); }
    else if(d.type==='sg:css'){ var sc=document.getElementById('sg-ai'); if(!sc){ sc=document.createElement('style'); sc.id='sg-ai'; (document.head||document.documentElement).appendChild(sc); } sc.textContent=typeof d.css==='string'?d.css:''; }
  });
  window.addEventListener('scroll',redraw,true);
  window.addEventListener('resize',redraw);

  function ready(){ document.body.appendChild(ov); scan(); try{ var mo=new MutationObserver(debounce(function(){scan();},250)); mo.observe(document.body,{childList:true,subtree:true}); }catch(e){} send({type:'sg:ready'}); }
  var tries=0; (function wait(){ tries++; if(document.querySelector('[data-sg-path],[data-sg-img]')||tries>240) ready(); else requestAnimationFrame(wait); })();
})();
`;

/** Injecte le runtime d'édition + la whitelist des champs dans le HTML du site. */
export function injectEditChrome(
  html: string,
  opts: { editableFields: EditableFieldSpec[] },
): string {
  const inject =
    `<script>window.__SG_FIELDS__=${safeJson(opts.editableFields)};</script>` +
    `<script>${RUNTIME}</script>`;
  // Fonction de remplacement : sinon String.replace interprète les motifs $&/$'/$$
  // présents dans le runtime (regex) et corrompt le code injecté.
  if (html.includes("</body>")) return html.replace("</body>", () => `${inject}</body>`);
  return html + inject;
}
