/* G Mart — premium enhancements (generated) */

/* ===== delight-animations ===== */
try{ (function(){
/* gm2 micro-delight: fly-to-cart arc + cart bounce + badge pulse.
   Runs inside the harness IIFE (try/catch wrapped). Uses event delegation on
   document (capture phase) so it never interferes with the site's own .add-cart
   onclick (inc()), works for the 200+ card grid, and survives re-renders. */

var GM2_RM = false;
try { GM2_RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

function gm2RectCenter(el){
  var r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function gm2Bump(){
  var cart = document.querySelector('.amz-cart');
  var badge = document.getElementById('badge');
  if(cart){
    cart.classList.remove('gm2-cart-bounce');
    void cart.offsetWidth;                  /* reflow so the animation can restart */
    cart.classList.add('gm2-cart-bounce');
    setTimeout(function(){ if(cart) cart.classList.remove('gm2-cart-bounce'); }, 600);
  }
  if(badge){
    badge.classList.remove('gm2-badge-pulse');
    void badge.offsetWidth;
    badge.classList.add('gm2-badge-pulse');
    setTimeout(function(){ if(badge) badge.classList.remove('gm2-badge-pulse'); }, 500);
  }
}

function gm2Fly(card){
  var cart = document.querySelector('.amz-cart');
  if(!card || !cart){ gm2Bump(); return; }

  /* prefer the product image; fall back to the .thumb (placeholder cards) */
  var srcImg = card.querySelector('img.pimg');
  var src = srcImg || card.querySelector('.thumb');
  if(!src){ gm2Bump(); return; }

  var sr = src.getBoundingClientRect();
  if(sr.width < 2 || sr.height < 2){ gm2Bump(); return; }   /* offscreen/hidden */

  var cx = sr.left + sr.width / 2;
  var cy = sr.top + sr.height / 2;
  var target = gm2RectCenter(cart);

  var clone;
  if(srcImg){
    clone = srcImg.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('loading');
    clone.removeAttribute('onerror');
  } else {
    clone = document.createElement('div');
    clone.className = 'gm2-fly-dot';
  }
  clone.className = (clone.className ? clone.className + ' ' : '') + 'gm2-fly';

  var startSize = Math.min(sr.width, sr.height);
  if(startSize > 120){ startSize = 120; }
  if(startSize < 40){ startSize = 40; }

  clone.style.left = (cx - startSize / 2) + 'px';
  clone.style.top  = (cy - startSize / 2) + 'px';
  clone.style.width = startSize + 'px';
  clone.style.height = startSize + 'px';
  document.body.appendChild(clone);

  var dx = target.x - cx;
  var dy = target.y - cy;
  var arc = Math.min(170, Math.max(70, Math.abs(dx) * 0.32 + 60));  /* upward bow */

  var done = false;
  function cleanup(){
    if(done){ return; }
    done = true;
    if(clone && clone.parentNode){ clone.parentNode.removeChild(clone); }
    gm2Bump();
  }

  if(clone.animate){
    var anim = clone.animate([
      { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
      { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy * 0.5 - arc) + 'px) scale(0.7)', opacity: 0.95, offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.16)', opacity: 0.15 }
    ], { duration: 720, easing: 'cubic-bezier(.5,.05,.5,1)', fill: 'forwards' });
    anim.onfinish = cleanup;
    setTimeout(cleanup, 900);   /* safety net if onfinish never fires */
  } else {
    cleanup();
  }
}

document.addEventListener('click', function(ev){
  var t = ev.target;
  var btn = (t && t.closest) ? t.closest('.add-cart') : null;
  if(!btn){ return; }
  var card = btn.closest('.card');
  if(GM2_RM){ gm2Bump(); return; }   /* reduced motion: skip the fly, keep a subtle pulse */
  gm2Fly(card);
}, true);
})(); }catch(e){ console.warn('[enhance:delight-animations] skipped:', e); }

/* ===== scroll-ux ===== */
try{ (function(){
// ===== gm2 scroll experience =====
var doc = document, root = doc.documentElement, body = doc.body;
if (!body) return;

var reduceMotion = false;
try {
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion = mq.matches;
  var onMq = function(e){ reduceMotion = e.matches; };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  else if (mq.addListener) mq.addListener(onMq);
} catch(e){}

// guard against double-injection
if (doc.getElementById('gm2-progress') || doc.getElementById('gm2-top')) return;

// (1) progress bar
var bar = doc.createElement('div');
bar.id = 'gm2-progress';
bar.setAttribute('aria-hidden', 'true');
var fill = doc.createElement('div');
fill.id = 'gm2-progress-fill';
bar.appendChild(fill);
body.appendChild(bar);

// (2) back-to-top button
var btn = doc.createElement('button');
btn.id = 'gm2-top';
btn.type = 'button';
btn.setAttribute('aria-label', 'Back to top');
btn.title = 'Back to top';
btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<path d="M12 19V6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<path d="M6 11l6-6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';
body.appendChild(btn);

btn.addEventListener('click', function(){
  if (reduceMotion) {
    window.scrollTo(0, 0);
  } else {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch(err) {
      window.scrollTo(0, 0);
    }
  }
  // move focus to top of document for keyboard users without re-scrolling
  try { (doc.querySelector('header.amz') || body).focus({ preventScroll: true }); } catch(e2){}
});

var header = doc.querySelector('header.amz');

// (4) single throttled scroll handler via rAF
var ticking = false;
var lastShown = false;
var lastShrunk = false;
var lastPct = -1;

function update(){
  ticking = false;

  var scrollTop = window.pageYOffset || root.scrollTop || 0;
  var docH = root.scrollHeight - root.clientHeight;
  var pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
  if (pct < 0) pct = 0; else if (pct > 100) pct = 100;

  // round to avoid layout thrash on tiny deltas
  var rounded = Math.round(pct * 10) / 10;
  if (rounded !== lastPct) {
    fill.style.width = rounded + '%';
    lastPct = rounded;
  }

  // back-to-top visibility (~600px)
  var show = scrollTop > 600;
  if (show !== lastShown) {
    btn.classList.toggle('gm2-show', show);
    lastShown = show;
  }

  // header shrink (~120px)
  if (header) {
    var shrunk = scrollTop > 120;
    if (shrunk !== lastShrunk) {
      header.classList.toggle('gm2-shrunk', shrunk);
      lastShrunk = shrunk;
    }
  }
}

function onScroll(){
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(update);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// initial paint
update();
})(); }catch(e){ console.warn('[enhance:scroll-ux] skipped:', e); }

/* ===== trust-conversion ===== */
try{ (function(){
/* ---------- (1) top announcement bar ---------- */
if(!document.getElementById('gm2-anns') && document.body){
  var annMsgs=[
    {svg:'<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="1.8"/><circle cx="18.5" cy="18.5" r="1.8"/></svg>',t:'Free delivery on orders over ₹199'},
    {svg:'<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',t:'100% genuine brands — quality assured'},
    {svg:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3.5-6.6"/><path d="M21 4v4h-4"/></svg>',t:'Easy 7-day returns, no questions asked'},
    {svg:'<svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>',t:'Mega Week is live — save up to 40% off'}
  ];
  var bar=document.createElement('div');
  bar.className='gm2-anns';
  bar.id='gm2-anns';
  bar.setAttribute('role','region');
  bar.setAttribute('aria-label','Store announcements');
  var inner='<div class="gm2-anns-row"><div class="gm2-anns-track" id="gm2-anns-track">';
  for(var i=0;i<annMsgs.length;i++){
    inner+='<div class="gm2-anns-msg'+(i===0?' gm2-on':'')+'"'+(i===0?' aria-live="polite"':' aria-hidden="true"')+'>'+
      annMsgs[i].svg+'<span class="gm2-dot"></span><span>'+annMsgs[i].t+'</span></div>';
  }
  inner+='</div><button class="gm2-anns-x" id="gm2-anns-x" type="button" aria-label="Dismiss announcements">'+
    '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
  bar.innerHTML=inner;
  document.body.insertBefore(bar,document.body.firstChild);

  var slides=bar.querySelectorAll('.gm2-anns-msg');
  var idx=0,timer=null;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function rotate(){
    slides[idx].classList.remove('gm2-on');
    slides[idx].setAttribute('aria-hidden','true');
    slides[idx].removeAttribute('aria-live');
    idx=(idx+1)%slides.length;
    slides[idx].classList.add('gm2-on');
    slides[idx].setAttribute('aria-live','polite');
    slides[idx].removeAttribute('aria-hidden');
  }
  if(slides.length>1){ timer=setInterval(rotate,4000); }

  document.getElementById('gm2-anns-x').addEventListener('click',function(){
    if(timer){clearInterval(timer);timer=null;}
    bar.parentNode&&bar.parentNode.removeChild(bar);
    try{if(typeof toast==='function')toast('Announcements hidden');}catch(e){}
  });
}

/* ---------- (2) "Why shop with G Mart" trust row before footer ---------- */
if(!document.getElementById('gm2-why')){
  var footEl=document.querySelector('footer');
  if(footEl&&footEl.parentNode){
    var whyItems=[
      {svg:'<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',h:'Genuine products',s:'Sourced from authorised brands only'},
      {svg:'<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V8a5 5 0 0 1 10 0v3"/></svg>',h:'Secure payments',s:'Encrypted checkout, trusted gateways'},
      {svg:'<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="1.8"/><circle cx="18.5" cy="18.5" r="1.8"/></svg>',h:'Fast delivery',s:'Same-day dispatch on essentials'},
      {svg:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3.5-6.6"/><path d="M21 4v4h-4"/></svg>',h:'Easy returns',s:'7-day no-questions-asked refunds'}
    ];
    var why=document.createElement('section');
    why.className='gm2-why';
    why.id='gm2-why';
    why.setAttribute('aria-label','Why shop with G Mart');
    var wh='<div class="gm2-why-in"><div class="gm2-why-title">Why shop with G Mart</div><div class="gm2-why-grid">';
    for(var j=0;j<whyItems.length;j++){
      wh+='<div class="gm2-why-item"><span class="gm2-why-ic">'+whyItems[j].svg+'</span>'+
        '<span class="gm2-why-tx"><b>'+whyItems[j].h+'</b><span>'+whyItems[j].s+'</span></span></div>';
    }
    wh+='</div></div>';
    why.innerHTML=wh;
    footEl.parentNode.insertBefore(why,footEl);
  }
}
})(); }catch(e){ console.warn('[enhance:trust-conversion] skipped:', e); }
