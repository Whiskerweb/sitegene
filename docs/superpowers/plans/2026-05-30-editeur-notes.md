# Éditeur « WordPress simple » + Notes épinglées — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les zones texte/image éditables visibles en permanence (style WordPress) et ajouter un outil « Note » qui épingle une demande structurelle/stylistique à un endroit précis du site, reçue par l'opérateur avec sa localisation exacte (sans capture d'écran).

**Architecture:** On étend l'éditeur existant (`/editor`, runtime injecté `lib/edit-runtime.ts`, `EditorClient.tsx`) et le flux de notes existant (`/api/notes` → `/admin/notes` → `/api/operator/notes/approve` → worker). Le runtime gère deux modes par `postMessage` (`edit`/`note`) ; en mode note, un clic capture l'élément cible (`data-sg-path` ou sélecteur CSS) + sa position % et l'envoie au parent. La localisation est stockée dans `notes.selector` (colonne `jsonb` déjà existante). La vue opérateur iframe le site public `/s/{slug}` et dessine les pins en lisant le `contentDocument` (same-origin).

**Tech Stack:** Next.js 16 (route handlers, server/client components), React 19, TypeScript, Tailwind v4 (DA cloud), Supabase (admin client), runtime vanilla JS injecté. Pas de framework de test installé → vérif par `npm run build`, `npm run lint`, un script node `tsx` pour la logique pure, et tests manuels navigateur (documentés).

**Référence DA :** réutiliser `components/ui/*` (Button, Field/Textarea, Badge, Spinner, icons) + tokens cloud (`brand #2563eb`, `night`, `slate`, `mist`, `success`, `surface`, `.glass`, `.shadow-cloud`). Statuts de note via `lib/ui/status.ts` (`noteStatusMeta`).

---

## File Structure

**Créés :**
- `lib/notes-selector.ts` — type `PinSelector` + `parsePinSelector(input): PinSelector | null` (validation pure, réutilisée par `/api/notes`).
- `scripts/test-notes-selector.mjs` — test node de `parsePinSelector` (logique pure, sans DOM).
- `app/admin/notes/NotesBoard.tsx` — composant client : iframe `/s/{slug}` + overlay de pins (lit `contentDocument`) + panneau de notes.

**Modifiés :**
- `lib/edit-runtime.ts` — affordances permanentes (cadres + étiquettes TEXTE/PHOTO via couche overlay) ; modes `edit`/`note` ; capture cible+position au clic en mode note ; dessin des pins (`sg:pins`).
- `app/api/notes/route.ts` — accepter/valider `selector` via `parsePinSelector`, l'insérer dans `notes.selector`.
- `app/editor/page.tsx` — charger les notes existantes du site (id, message, status, selector) et les passer à `EditorClient`.
- `app/editor/EditorClient.tsx` — barre latérale gauche (outils Modifier/Note), envoi `sg:mode`/`sg:pins` à l'iframe, réception `sg:note`, bulle de saisie, liste « Mes notes », `POST /api/notes`.
- `app/admin/notes/page.tsx` — regrouper les notes par site, charger `selector`+slug, rendre `NotesBoard` par site.
- `app/api/operator/notes/approve/route.ts` — enrichir l'instruction du job avec le libellé de la cible (`selector.label`) pour que le worker sache où agir.

**Pas touché :** `app/api/preview/route.ts` (le mode note est piloté au runtime par message, l'injection reste la même). Aucune migration (`notes.selector` jsonb existe déjà). Crédits inchangés.

---

## Task 1 : Validation du sélecteur de pin (`/api/notes`)

**Files:**
- Create: `lib/notes-selector.ts`
- Create: `scripts/test-notes-selector.mjs`
- Modify: `app/api/notes/route.ts`

- [ ] **Step 1 : Écrire le validateur pur `lib/notes-selector.ts`**

```ts
// lib/notes-selector.ts
/** Localisation d'une note épinglée (stockée dans notes.selector jsonb). Aucune capture. */
export type PinSelector = {
  path?: string;        // data-sg-path / data-sg-img de l'élément cible, si présent
  cssSelector: string;  // sélecteur CSS de repli vers l'élément
  label: string;        // libellé lisible (ex. « bouton « Réserver » », « photo »)
  xPct: number;         // position du clic en % de la largeur totale du document (0–100)
  yPct: number;         // position du clic en % de la hauteur totale du document (0–100)
};

const clampPct = (n: unknown): number | null => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v < 0 || v > 100) return null;
  return Math.round(v * 100) / 100;
};

/** Valide/normalise un selector venant du client. Retourne null si invalide. */
export function parsePinSelector(input: unknown): PinSelector | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const cssSelector = typeof o.cssSelector === "string" ? o.cssSelector.slice(0, 400) : "";
  const label = typeof o.label === "string" ? o.label.slice(0, 80) : "";
  const xPct = clampPct(o.xPct);
  const yPct = clampPct(o.yPct);
  if (!cssSelector || xPct === null || yPct === null) return null;
  const path = typeof o.path === "string" && o.path.length <= 200 ? o.path : undefined;
  return { ...(path ? { path } : {}), cssSelector, label, xPct, yPct };
}
```

- [ ] **Step 2 : Écrire le test node `scripts/test-notes-selector.mjs`**

```js
// scripts/test-notes-selector.mjs — node --import tsx scripts/test-notes-selector.mjs
import { parsePinSelector } from "../lib/notes-selector.ts";

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error("✗", msg); } else console.log("✓", msg); };

const valid = parsePinSelector({ cssSelector: "section:nth-of-type(2)>button", label: "bouton « X »", xPct: 50, yPct: 12.3456 });
ok(valid && valid.cssSelector.startsWith("section"), "selector valide accepté");
ok(valid && valid.yPct === 12.35, "yPct arrondi à 2 décimales");
ok(valid && valid.path === undefined, "path absent → omis");

ok(parsePinSelector({ cssSelector: "", label: "x", xPct: 1, yPct: 1 }) === null, "cssSelector vide rejeté");
ok(parsePinSelector({ cssSelector: "a", label: "x", xPct: 200, yPct: 1 }) === null, "xPct hors borne rejeté");
ok(parsePinSelector(null) === null, "null rejeté");
ok(parsePinSelector({ cssSelector: "a", label: "x", xPct: 1, yPct: 1, path: "hero.title[0]" })?.path === "hero.title[0]", "path conservé");

console.log(fails === 0 ? "\nTOUS OK" : `\n${fails} ÉCHEC(S)`);
process.exit(fails === 0 ? 0 : 1);
```

- [ ] **Step 3 : Lancer le test → il doit passer**

Run: `cd sitegene && node --import tsx scripts/test-notes-selector.mjs`
Expected: `TOUS OK`. Si un cas échoue, corriger `lib/notes-selector.ts` jusqu'au vert.

- [ ] **Step 4 : Brancher `selector` dans `app/api/notes/route.ts`**

Remplacer le corps de `POST` pour lire et valider `selector` :

```ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePinSelector } from "@/lib/notes-selector";

/** Le client dépose une demande de modification (note), éventuellement épinglée à un endroit. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { siteId, message, selector } = await request.json();
  if (!siteId || !String(message ?? "").trim()) {
    return NextResponse.json({ error: "Message requis." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, owner_user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || site.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Site non autorisé." }, { status: 403 });
  }

  const pin = selector ? parsePinSelector(selector) : null; // null = note non épinglée (toléré)

  const { data: inserted, error } = await admin
    .from("notes")
    .insert({
      site_id: siteId,
      author_user_id: user.id,
      message: String(message).slice(0, 1000),
      status: "open",
      selector: pin,
    })
    .select("id, message, status, selector, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, note: inserted });
}
```

- [ ] **Step 5 : Vérifier build + commit**

Run: `cd sitegene && npm run build`
Expected: compile sans erreur ; route `/api/notes` listée.

```bash
git add lib/notes-selector.ts scripts/test-notes-selector.mjs app/api/notes/route.ts
git commit -m "feat(notes): accepte et valide un selector de pin (localisation) sur /api/notes"
```

---

## Task 2 : Runtime — affordances permanentes + modes edit/note + pins

**Files:**
- Modify: `lib/edit-runtime.ts` (la constante `RUNTIME` et la signature de `injectEditChrome`)

Le runtime est une chaîne JS injectée dans l'iframe. On la remplace par une version qui : (a) dessine des cadres + étiquettes TEXTE/PHOTO en permanence (mode edit), (b) gère un mode `note` piloté par le parent, (c) capture la cible+position au clic en mode note, (d) dessine des pins numérotés.

- [ ] **Step 1 : Remplacer la constante `RUNTIME` dans `lib/edit-runtime.ts`**

Remplacer entièrement le bloc `const RUNTIME = String.raw\`...\`;` par :

```ts
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
    'html.sg-on [data-sg-path],html.sg-on [data-sg-img]{outline:1.5px dashed rgba(37,99,235,.6);outline-offset:2px;border-radius:3px}'+
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
    var t=pin.target, el=null;
    if(t){
      if(t.path){ try{ el=document.querySelector('[data-sg-path="'+cssEsc(t.path)+'"],[data-sg-img="'+cssEsc(t.path)+'"]'); }catch(e){} }
      if(!el&&t.cssSelector){ try{ el=document.querySelector(t.cssSelector); }catch(e){} }
    }
    if(el){ var r=el.getBoundingClientRect(); return {x:r.left+window.scrollX+r.width/2,y:r.top+window.scrollY+12}; }
    if(t){ return {x:(t.xPct/100)*document.documentElement.scrollWidth,y:(t.yPct/100)*document.documentElement.scrollHeight}; }
    return null;
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
    send({type:'sg:note',target:{path:path||undefined,cssSelector:buildSelector(aim),label:labelFor(aim),xPct:(e.pageX/docW)*100,yPct:(e.pageY/docH)*100}});
  }, true);
  // En mode edit, un clic sur un lien ne navigue pas.
  document.addEventListener('click',function(e){ if(mode!=='edit') return; var a=e.target&&e.target.closest&&e.target.closest('a'); if(a) e.preventDefault(); }, true);

  window.addEventListener('message',function(e){
    if(e.origin!==ORIGIN) return; var d=e.data||{};
    if(d.type==='sg:setValue'){ var ns=document.querySelectorAll('[data-sg-path="'+cssEsc(d.path)+'"]'); for(var i=0;i<ns.length;i++){ ns[i].textContent=d.value; var h=ns[i].getAttribute&&ns[i].getAttribute('href'); if(h&&h.indexOf('mailto:')===0) ns[i].setAttribute('href','mailto:'+d.value); } redraw(); }
    else if(d.type==='sg:setPhoto'){ var ms=document.querySelectorAll('[data-sg-img="'+cssEsc(d.path)+'"]'); for(var k=0;k<ms.length;k++){ if(ms[k].tagName==='IMG') ms[k].src=d.url; else ms[k].style.backgroundImage='url('+d.url+')'; } redraw(); }
    else if(d.type==='sg:mode'){ mode=d.mode==='note'?'note':'edit'; document.documentElement.classList.toggle('sg-note',mode==='note'); setEditable(mode==='edit'); draw(); }
    else if(d.type==='sg:pins'){ pins=Array.isArray(d.pins)?d.pins:[]; if(mode==='note') draw(); }
  });
  window.addEventListener('scroll',redraw,true);
  window.addEventListener('resize',redraw);

  function ready(){ document.body.appendChild(ov); scan(); try{ var mo=new MutationObserver(debounce(function(){scan();},250)); mo.observe(document.body,{childList:true,subtree:true}); }catch(e){} send({type:'sg:ready'}); }
  var tries=0; (function wait(){ tries++; if(document.querySelector('[data-sg-path],[data-sg-img]')||tries>240) ready(); else requestAnimationFrame(wait); })();
})();
`;
```

- [ ] **Step 2 : Vérifier qu'aucun `${` ne subsiste dans `RUNTIME` (casserait l'interpolation)**

Run: `cd sitegene && grep -n '\${' lib/edit-runtime.ts | grep -v 'safeJson\|inject\|RUNTIME}'`
Expected: aucune ligne (les seuls `${...}` autorisés sont dans `injectEditChrome`, pas dans le bloc `RUNTIME`).

- [ ] **Step 3 : Build le projet Next (le runtime n'est pas typé mais doit être une string TS valide)**

Run: `cd sitegene && npm run build`
Expected: compile sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add lib/edit-runtime.ts
git commit -m "feat(editor): cadres TEXTE/PHOTO permanents + modes edit/note + pins dans le runtime"
```

---

## Task 3 : EditorClient — barre latérale, mode note, bulle, liste « Mes notes »

**Files:**
- Modify: `app/editor/page.tsx` (charger les notes du site)
- Modify: `app/editor/EditorClient.tsx`

- [ ] **Step 1 : Charger les notes dans `app/editor/page.tsx`**

Après le chargement de `top`, ajouter la récupération des notes et la passer au client :

```ts
  const { data: notes } = await admin
    .from("notes")
    .select("id, message, status, selector, created_at")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(100);
```

Et dans le JSX de retour, ajouter la prop :

```tsx
    <EditorClient
      siteId={site.id}
      slug={site.slug}
      balance={balance}
      hasUnpublished={top ? !top.is_published : false}
      editableFields={editableFields}
      content={(top?.content_json as Record<string, unknown>) ?? {}}
      notes={(notes ?? []) as EditorNote[]}
    />
```

Ajouter en haut de `editor/page.tsx` l'import et le type :

```ts
import EditorClient, { type EditableField, type EditorNote } from "./EditorClient";
```

- [ ] **Step 2 : Étendre `EditorClient.tsx` — types + props + état mode/notes**

Ajouter le type exporté et étendre `Props`/imports :

```tsx
import { IconCheck, IconChevron, IconEdit, IconPhoto } from "@/components/ui/icons";
import { noteStatusMeta } from "@/lib/ui/status";
import type { PinSelector } from "@/lib/notes-selector";

export type EditorNote = {
  id: string;
  message: string;
  status: string;
  selector: PinSelector | null;
  created_at: string;
};
```

Ajouter `notes` à `Props` :

```tsx
type Props = {
  siteId: string;
  slug: string | null;
  balance: number;
  hasUnpublished: boolean;
  editableFields: EditableField[];
  content: Record<string, unknown>;
  notes: EditorNote[];
};
```

Dans le composant, après les états existants, ajouter :

```tsx
  const [tool, setTool] = useState<"edit" | "note">("edit");
  const [notes, setNotes] = useState<EditorNote[]>(initialNotes);
  const [noteDraft, setNoteDraft] = useState<{ target: PinSelector; message: string } | null>(null);
  const [sendingNote, setSendingNote] = useState(false);
```

(et déstructurer `notes: initialNotes` dans la signature). Construire la liste de pins (notes épinglées) et un util pour l'envoyer à l'iframe :

```tsx
  const sendPins = useCallback(
    (list: EditorNote[]) => {
      const pins = list
        .filter((n) => n.selector)
        .map((n, i) => ({ n: i + 1, target: n.selector }));
      post({ type: "sg:pins", pins });
    },
    [post],
  );

  const switchTool = useCallback(
    (t: "edit" | "note") => {
      setTool(t);
      post({ type: "sg:mode", mode: t });
      if (t === "note") sendPins(notes);
    },
    [post, sendPins, notes],
  );
```

- [ ] **Step 3 : Recevoir `sg:note` dans le handler de messages**

Dans le `useEffect` qui écoute `message`, ajouter une branche après `sg:editPhoto` :

```tsx
      } else if (d.type === "sg:note") {
        const t = d.target;
        if (t && typeof t.cssSelector === "string") {
          setNoteDraft({
            target: {
              path: t.path,
              cssSelector: t.cssSelector,
              label: t.label ?? "",
              xPct: t.xPct,
              yPct: t.yPct,
            },
            message: "",
          });
        }
      }
```

(et ajouter `setNoteDraft` aux deps si nécessaire — il est stable, pas requis.)

- [ ] **Step 4 : Envoyer la note (`POST /api/notes`)**

Ajouter la fonction :

```tsx
  async function sendNote() {
    if (!noteDraft || !noteDraft.message.trim()) return;
    setSendingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteId,
          message: noteDraft.message.trim(),
          selector: noteDraft.target,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice(json.error ?? "Échec de l'envoi de la note.");
      } else if (json.note) {
        const next = [json.note as EditorNote, ...notes];
        setNotes(next);
        sendPins(next);
        setNoteDraft(null);
        setNotice("Note envoyée ✓ Nous la traiterons.");
      }
    } catch {
      setNotice("Échec de l'envoi de la note.");
    }
    setSendingNote(false);
  }
```

- [ ] **Step 5 : Refondre le layout — barre latérale gauche + outils + liste**

Remplacer le bloc `<div className="relative flex-1 overflow-hidden">…iframe…</div>` par une rangée [barre | iframe]. La barre latérale (DA cloud) :

```tsx
      <div className="flex flex-1 overflow-hidden">
        {/* Barre latérale gauche */}
        <aside className="flex w-[150px] flex-none flex-col gap-1 border-r border-sky-300 bg-white/70 p-3">
          <button
            onClick={() => switchTool("edit")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${tool === "edit" ? "bg-blue text-brand" : "text-slate hover:bg-sky-100"}`}
          >
            <IconEdit size={16} /> Modifier
          </button>
          <button
            onClick={() => switchTool("note")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${tool === "note" ? "bg-blue text-brand" : "text-slate hover:bg-sky-100"}`}
          >
            <span aria-hidden>📌</span> Note
          </button>

          <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-mist">
            Mes notes ({notes.length})
          </div>
          <div className="mt-1 flex flex-col gap-1.5 overflow-auto">
            {notes.map((n, i) => {
              const meta = noteStatusMeta[n.status] ?? noteStatusMeta.open;
              return (
                <div key={n.id} className="rounded-lg border border-sky-300 bg-white p-2 text-[11px]">
                  <div className="flex items-center gap-1 text-mist">
                    {n.selector && <span className="font-bold text-danger">📌 {i + 1}</span>}
                    <span>· {meta.label}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-slate">{n.message}</p>
                </div>
              );
            })}
            {notes.length === 0 && (
              <p className="text-[11px] text-mist">Aucune note. Outil 📌 pour en poser une.</p>
            )}
          </div>
        </aside>

        {/* Aperçu / éditeur */}
        <div className="relative flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`/api/preview?siteId=${siteId}&edit=1`}
            title="Éditeur de votre site"
            className="h-full w-full border-0"
          />
          {tool === "note" && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
              📌 Cliquez sur le site à l'endroit à modifier (couleur, section…)
            </div>
          )}
          {tool === "edit" && !touched && !panel && (
            <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-night/85 px-4 py-2 text-sm text-white shadow-cloud">
              👆 Cliquez sur un texte ou une photo pour le modifier
            </div>
          )}
        </div>
      </div>
```

- [ ] **Step 6 : Envoyer l'état initial au runtime quand l'iframe est prête**

Dans le handler `message`, sur réception de `sg:ready`, pousser le mode + pins courants. Ajouter au début du `onMsg` (après le contrôle d'origine) :

```tsx
      if (d.type === "sg:ready") {
        post({ type: "sg:mode", mode: tool });
        sendPins(notes);
        return;
      }
```

(ajouter `tool`, `notes`, `sendPins`, `post` aux deps du `useEffect`.)

- [ ] **Step 7 : Ajouter la bulle de saisie de note (modal ancrée, réutilise Field/Textarea)**

Avant la fermeture du composant (à côté des autres modals `panel`/`confirmPublish`), ajouter :

```tsx
      {noteDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/30 p-4"
          onClick={() => setNoteDraft(null)}
        >
          <div
            className="w-full max-w-lg rounded-[20px] bg-white p-6 shadow-cloud-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-archivo text-lg font-semibold text-night">Laisser une note</h3>
            <p className="mb-3 mt-1 text-sm text-mist">
              Cible : <b className="text-brand">{noteDraft.target.label || "cet endroit"}</b>. Décrivez
              le changement (couleur, section, catégorie…) — on s'en occupe.
            </p>
            <Field hint="1 crédit à la résolution de la demande.">
              <Textarea
                autoFocus
                rows={3}
                value={noteDraft.message}
                placeholder="Ex : mettez ce bouton en orange / ajoutez une section témoignages."
                onChange={(e) => setNoteDraft((d) => (d ? { ...d, message: e.target.value } : d))}
              />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteDraft(null)}>
                Annuler
              </Button>
              <Button size="sm" loading={sendingNote} disabled={!noteDraft.message.trim()} onClick={sendNote}>
                Envoyer la note
              </Button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 8 : Build + lint**

Run: `cd sitegene && npm run build && npm run lint`
Expected: 0 erreur. (Le `📌` emoji en JSX texte est dans des chaînes — ok.)

- [ ] **Step 9 : Vérif navigateur (session client, site live)**

1. `/editor` : par défaut outil **Modifier** → chaque texte/photo a un cadre + étiquette « TEXTE ✎ / PHOTO ↺ ». Rien sur les fonds/sections.
2. Clic outil **Note** → bandeau « Cliquez sur le site… », les cadres s'estompent.
3. Clic sur un bouton/section → bulle « Cible : bouton … » → message → **Envoyer** → la note apparaît dans « Mes notes » avec son pin numéroté visible sur le site.

- [ ] **Step 10 : Commit**

```bash
git add app/editor/page.tsx app/editor/EditorClient.tsx
git commit -m "feat(editor): outil Note (pin + bulle), barre latérale Modifier/Note, liste des notes"
```

---

## Task 4 : Vue opérateur — pins sur le site live

**Files:**
- Create: `app/admin/notes/NotesBoard.tsx`
- Modify: `app/admin/notes/page.tsx`
- Modify: `app/api/operator/notes/approve/route.ts`

- [ ] **Step 1 : Enrichir l'instruction du job avec la cible**

Dans `app/api/operator/notes/approve/route.ts`, sélectionner aussi `selector` et l'injecter dans l'instruction :

```ts
  const { data: note } = await admin
    .from("notes")
    .select("id, site_id, message, status, selector")
    .eq("id", noteId)
    .maybeSingle();
```

Et construire l'instruction avant l'insert du job :

```ts
  const sel = note.selector as { label?: string } | null;
  const instruction = sel?.label
    ? `${note.message}\n\n(Cible indiquée par le client : ${sel.label})`
    : note.message;

  await admin.from("jobs").insert({
    type: "modify_site",
    status: "pending",
    site_id: note.site_id,
    created_by: profile.id,
    payload: { siteId: note.site_id, instruction, noteId: note.id },
  });
```

- [ ] **Step 2 : Charger `selector` + slug groupés par site dans `app/admin/notes/page.tsx`**

Réécrire la page pour regrouper par site et rendre un `NotesBoard` par site (notes épinglées affichées sur le site live). Conserver le rendu legacy pour les notes sans selector.

```tsx
import { createClient } from "@/lib/supabase/server";
import NotesBoard from "./NotesBoard";

export const dynamic = "force-dynamic";

type Note = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  selector: { path?: string; cssSelector: string; label: string; xPct: number; yPct: number } | null;
  sites: { id: string; slug: string | null; status: string | null } | null;
};

export default async function AdminNotes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, message, status, created_at, selector, sites(id, slug, status)")
    .order("created_at", { ascending: false })
    .limit(200);
  const notes = (data ?? []) as unknown as Note[];

  // Regroupe par site (live uniquement pour l'aperçu visuel).
  const bySite = new Map<string, { slug: string | null; status: string | null; notes: Note[] }>();
  for (const n of notes) {
    if (!n.sites?.id) continue;
    const k = n.sites.id;
    if (!bySite.has(k)) bySite.set(k, { slug: n.sites.slug, status: n.sites.status, notes: [] });
    bySite.get(k)!.notes.push(n);
  }

  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">
        Demandes de modification
      </h1>
      <p className="mt-1 text-sm text-muted">
        Les notes épinglées apparaissent sur le site du client, là où il les a posées. Valide → le
        worker applique.
      </p>

      <div className="mt-8 space-y-10">
        {bySite.size === 0 && (
          <p className="rounded-[16px] border border-dashed border-line bg-ink-800 p-8 text-center text-muted">
            Aucune demande pour l'instant.
          </p>
        )}
        {[...bySite.entries()].map(([siteId, g]) => (
          <NotesBoard
            key={siteId}
            slug={g.slug}
            isLive={g.status === "live"}
            notes={g.notes.map((n) => ({
              id: n.id,
              message: n.message,
              status: n.status,
              selector: n.selector,
            }))}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Créer `app/admin/notes/NotesBoard.tsx` (client) — iframe + overlay de pins**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Sel = { path?: string; cssSelector: string; label: string; xPct: number; yPct: number } | null;
type Note = { id: string; message: string; status: string; selector: Sel };
type Pos = { id: string; n: number; x: number; y: number };

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "À traiter", color: "text-gold-400" },
  in_progress: { label: "En cours (Claude)", color: "text-violet-400" },
  done: { label: "Fait", color: "text-mint-400" },
  rejected: { label: "Refusé", color: "text-faint" },
};

export default function NotesBoard({
  slug,
  isLive,
  notes,
}: {
  slug: string | null;
  isLive: boolean;
  notes: Note[];
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(notes.map((n) => [n.id, n.status])),
  );

  const pinned = notes.filter((n) => n.selector);

  const reposition = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const docW = doc.documentElement.scrollWidth || 1;
    const docH = doc.documentElement.scrollHeight || 1;
    const next: Pos[] = [];
    pinned.forEach((n, i) => {
      const s = n.selector!;
      let el: Element | null = null;
      if (s.path) {
        try {
          el = doc.querySelector(`[data-sg-path="${s.path}"],[data-sg-img="${s.path}"]`);
        } catch {}
      }
      if (!el && s.cssSelector) {
        try {
          el = doc.querySelector(s.cssSelector);
        } catch {}
      }
      if (el) {
        const r = (el as HTMLElement).getBoundingClientRect();
        next.push({ id: n.id, n: i + 1, x: r.left + r.width / 2, y: r.top + 12 });
      } else {
        next.push({ id: n.id, n: i + 1, x: (s.xPct / 100) * docW, y: (s.yPct / 100) * docH });
      }
    });
    setPositions(next);
  }, [pinned]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      reposition();
      const win = iframe.contentWindow;
      win?.addEventListener("scroll", reposition, true);
      win?.addEventListener("resize", reposition);
    };
    iframe.addEventListener("load", onLoad);
    const t = setInterval(reposition, 1500); // re-render lazy images / fonts
    return () => {
      iframe.removeEventListener("load", onLoad);
      clearInterval(t);
    };
  }, [reposition]);

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/operator/notes/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId: id }),
      });
      if (res.ok) setStatuses((s) => ({ ...s, [id]: "in_progress" }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[16px] border border-line bg-ink-700 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-medium text-paper">{slug ? `/s/${slug}` : "site"}</span>
        <span className="text-faint">· {notes.length} demande(s)</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Site live + pins */}
        <div className="relative overflow-hidden rounded-xl border border-line bg-black/30">
          {isLive && slug ? (
            <div className="relative h-[420px] overflow-auto">
              <iframe
                ref={iframeRef}
                src={`/s/${slug}`}
                title={`Site ${slug}`}
                className="h-[420px] w-full border-0"
              />
              <div className="pointer-events-none absolute inset-0">
                {positions.map((p) => (
                  <div
                    key={p.id}
                    className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-full place-items-center rounded-[50%_50%_50%_0] text-xs font-extrabold text-white shadow-lg"
                    style={{
                      left: p.x,
                      top: p.y,
                      background: active === p.id ? "#2563eb" : "#e5412a",
                      outline: "2px solid #fff",
                      transform: "translate(-50%,-100%) rotate(-45deg)",
                    }}
                  >
                    <span style={{ transform: "rotate(45deg)" }}>{p.n}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid h-[420px] place-items-center text-sm text-faint">
              Site pas encore en ligne — pins indisponibles.
            </div>
          )}
        </div>

        {/* Panneau de notes */}
        <div className="space-y-2">
          {notes.map((n, idx) => {
            const pinIndex = pinned.findIndex((p) => p.id === n.id);
            const st = statusLabel[statuses[n.id]] ?? statusLabel.open;
            return (
              <div
                key={n.id}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
                className="rounded-xl border border-line bg-ink-800 p-3"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  {pinIndex >= 0 && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#e5412a] text-[11px] font-bold text-white">
                      {pinIndex + 1}
                    </span>
                  )}
                  {n.selector?.label && <span className="text-violet-300">cible : {n.selector.label}</span>}
                  <span className={`ml-auto ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-sm text-paper/90">{n.message}</p>
                {statuses[n.id] === "open" && (
                  <button
                    onClick={() => approve(n.id)}
                    disabled={busy === n.id}
                    className="btn-violet mt-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy === n.id ? "…" : "Approuver"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4 : Build + lint**

Run: `cd sitegene && npm run build && npm run lint`
Expected: 0 erreur. (`/admin/notes` reste sur le thème legacy dark — cohérent avec le reste de l'espace opérateur.)

- [ ] **Step 5 : Vérif navigateur (session opérateur)**

1. `/admin/notes` : pour un site live avec notes épinglées, le site s'affiche, les **pins numérotés sont aux bons endroits**.
2. Survol d'une carte → son pin passe en bleu.
3. **Approuver** → statut « En cours (Claude) » ; un job `modify_site` est créé avec l'instruction incluant la cible.

- [ ] **Step 6 : Commit**

```bash
git add app/admin/notes/page.tsx app/admin/notes/NotesBoard.tsx app/api/operator/notes/approve/route.ts
git commit -m "feat(admin): notes épinglées affichées sur le site live + cible passée au worker"
```

---

## Task 5 : Vérification bout-en-bout + non-régression

- [ ] **Step 1 : Logique pure**

Run: `cd sitegene && node --import tsx scripts/test-notes-selector.mjs`
Expected: `TOUS OK`.

- [ ] **Step 2 : Build + lint complets**

Run: `cd sitegene && npm run build && npm run lint`
Expected: 0 erreur.

- [ ] **Step 3 : Parcours client (navigateur, site live possédé)**
- Mode Modifier : cadres TEXTE/PHOTO visibles sur textes+images uniquement ; édition inline d'un texte + swap d'une photo fonctionnent toujours ; **Publier (1 crédit)** marche.
- Mode Note : poser un pin sur un fond/bouton → bulle → envoyer → pin visible + note dans « Mes notes ».

- [ ] **Step 4 : Parcours opérateur (navigateur)**
- `/admin/notes` : pins aux bons endroits sur `/s/{slug}`, cible + message lisibles, **Approuver** crée le job.
- Worker (`npm run worker`) : la modif est appliquée et 1 crédit débité (`note_spend`) — flux existant inchangé.

- [ ] **Step 5 : Non-régression base**

Run (psql) : vérifier qu'une note épinglée a bien `selector` rempli et `screenshot_path` NULL :
```sql
select id, status, screenshot_path, selector from public.notes order by created_at desc limit 3;
```
Expected: `selector` = `{path?,cssSelector,label,xPct,yPct}`, `screenshot_path` NULL.

---

## Self-Review (rempli)

**Couverture du spec :**
- Affordances permanentes texte/image → Task 2 (badges overlay + outline).
- Outil Note + capture cible/position → Task 2 (runtime) + Task 3 (UI).
- `selector` en backend, zéro capture → Task 1 (`/api/notes` + validation) ; `screenshot_path` jamais écrit.
- Vue opérateur (iframe `/s/{slug}` + pins via contentDocument + Approuver) → Task 4.
- Cible transmise au worker → Task 4 Step 1.
- Crédits inchangés (publish=edit_publish, note=note_spend) → aucun changement de crédit.

**Placeholders :** aucun « TODO/TBD » ; code complet à chaque étape.

**Cohérence des types :** `PinSelector` défini dans `lib/notes-selector.ts`, réutilisé par `/api/notes`, `EditorNote`, `NotesBoard`. Messages runtime : `sg:mode`/`sg:pins`/`sg:note` cohérents entre runtime (Task 2) et EditorClient (Task 3). `notes.selector` jsonb (existant) = stockage.

**Cas limites couverts :** élément introuvable → fallback xPct/yPct (runtime `locate` + `NotesBoard.reposition`) ; note non épinglée → `selector` null toléré ; site non live côté opérateur → message « pins indisponibles ».
