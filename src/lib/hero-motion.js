// Port of approved sketch 107 H8, rounds 9–9d. Camera geometry/timings retained.
// React owns the rest DOM; this module owns only cancellable effects.
export function mountHero(pane) {
 const replay = pane.querySelector('.replay');
 const stage = pane.querySelector('.map-stage');
 const canvas = pane.querySelector('.zoom-canvas');
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const sessionKey = 'jm-hero-h8-played';
 const duration = 3600, zoomStart = 600, zoomDuration = 1700, startScale = 72;
 const origin = { x: 49.6, y: 53 };
 const cameraOrigin = { x: .495215311005, y: .514354066986 };
 const landing = zoomStart + zoomDuration, fogStart = landing + 150;
 const radarStart = fogStart + 100, radarEnd = 2950, radarRadius = 700, colourReturn = 3210;
 const streetScale = 100 / (12.5 * 49 / 130);
 // Round-7 base rectangles and songkok anchors, as fractions of the stage.
 // Covered outer paintings retain their old capped camera scale until exposed.
 const paintings = [
  {name:'city',src:'/hero/l4-city.webp',x:0,y:0,size:1,maxScale:8},
  {name:'block',src:'/hero/l3-block.webp',x:.436403508772,y:.445075757576,size:.125,maxScale:streetScale,anchor:[.470494417863,.554226475279]},
  {name:'street',src:'/hero/l2-street.webp',x:.475264538093,y:.493501564225,size:.04711538461538462,maxScale:72,anchor:[.423444976077,.442583732057]},
  {name:'close',src:'/hero/l1-close.webp',x:.489553548764,y:.508780311412,size:.018393393393393394,maxScale:72,anchor:[.307814992026,.303030303030]}
 ];
 const handoffs = [['close',startScale,streetScale],['street',streetScale,8],['block',8,1]]
  .map(([name,from,next])=>({name,from,to:from-.28*(from-next)}));
 // Source-pixel inner corners (geometry-r9.json). The homography and rounded
 // corners are baked offline; runtime clips only the incoming reveal edge.
 const screenQuads = {
  close:[[641,382],[753.2,410.5],[684,641.6],[573.8,610.2]],
  street:[[631.8,550.8],[677.2,560.5],[648,652.8],[603.8,640.2]],
  block:[[628.4,692.4],[644.5,696.3],[632.8,728.2],[617.7,724.3]]
 };
 // Same source-pixel bounding box + 2 px margin as warp-screen.py; the JSON
 // stores these rectangles too. Screenshot replacement never changes them.
 const screenRects = new Map(Object.entries(screenQuads).map(([name,quad])=>{
  const xs=quad.map(p=>p[0]),ys=quad.map(p=>p[1]);
  const x=Math.floor(Math.min(...xs))-2,y=Math.floor(Math.min(...ys))-2;
  return [name,[x,y,Math.ceil(Math.max(...xs))+2-x,Math.ceil(Math.max(...ys))+2-y]];
 }));
 let animations = [], generation = 0, disposed = false, frame = 0, renderer = null;
 let size = {width:0,height:0,dx:1,dy:1};
 const at = (ms, values, easing) => ({offset:ms/duration,...values,...(easing?{easing}:{})});
 function animate(node, frames, timing = {}) {
  const animation = node.animate(frames,{duration,fill:'both',easing:'linear',...timing});
  animations.push(animation);
  return animation;
 }
 function freeMasks() {
  if(!renderer) return;
  for(const masked of renderer.masks.values()) masked.width=masked.height=0;
  for(const masked of renderer.screenMasks.values()) masked.width=masked.height=0;
  renderer.masks.clear();
  renderer.screenMasks.clear();
 }
 function stopCanvas() {
  cancelAnimationFrame(frame); frame=0;
  freeMasks(); renderer=null;
  if(canvas) { canvas.hidden=true; canvas.width=canvas.height=0; }
  delete pane.dataset.zoom;
 }
 function restoreFallback() {
  pane.classList.remove('canvas-art');
  pane.dataset.artStatus='fallback';
  for (const surface of pane.querySelectorAll('canvas[data-art]')) surface.width=surface.height=0;
 }
 function rest() {
  generation++;
  stopCanvas();
  animations.forEach(animation => animation.cancel());
  animations = [];
  pane.dataset.state = 'rest';
  replay.disabled = false;
  replay.hidden = motion.matches || typeof pane.animate !== 'function';
  if (motion.matches) {
   restoreFallback();
  }
 }
 function seen() { try { return sessionStorage.getItem(sessionKey)==='1'; } catch { return false; } }
 function remember() { try { sessionStorage.setItem(sessionKey,'1'); } catch { /* Storage can be unavailable. */ } }
 // Let the actual heading font paint before decoding or painting the artwork.
 const textPainted = (async()=>{
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 })();
 async function decoded(images) {
  let timeout;
  try {
   await Promise.race([
    Promise.all(images.map(img=>img.decode())),
    new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Artwork timeout')),8000);})
   ]);
  } finally { clearTimeout(timeout); }
 }
 function contextFor(surface) {
  const context=surface?.getContext('2d');
  if(!context) throw new Error('Canvas unavailable');
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  return context;
 }
 function measure() {
  const {width,height}=stage.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,3);
  const backingWidth=Math.floor(width*dpr),backingHeight=Math.floor(height*dpr);
  if(!width||!height) throw new Error('Empty stage');
  size={width,height,dx:backingWidth/width,dy:backingHeight/height};
  return {backingWidth,backingHeight};
 }
 function paintRest() {
  if (disposed || motion.matches) return;
  pane.classList.add('canvas-art');
  pane.dataset.artStatus='painted';
  const {backingWidth,backingHeight}=measure();
  for(const surface of pane.querySelectorAll('canvas[data-art]')) {
   const image=pane.querySelector(surface.dataset.art);
   const city=surface.classList.contains('painted-art');
   const dpr=Math.min(window.devicePixelRatio||1,3);
   if(!city&&!surface.clientWidth) { surface.width=surface.height=0; continue; }
   surface.width=city?backingWidth:Math.max(1,Math.floor(surface.clientWidth*dpr));
   surface.height=city?backingHeight:Math.max(1,Math.floor(surface.clientWidth*image.naturalHeight/image.naturalWidth*dpr));
   contextFor(surface).drawImage(image,0,0,surface.width,surface.height);
  }
 }
 // The ordinary DOM city/phone/sprites remain the no-JS and failure fallback.
 const artwork = (async () => {
  try {
   await textPainted;
   if(disposed) return;
   for (const image of pane.querySelectorAll('img[data-art-src]')) image.src=image.dataset.artSrc;
   await decoded([...pane.querySelectorAll('img')]);
   paintRest();
  } catch(error) { restoreFallback(); throw error; }
 })();
 artwork.catch(()=>{});
 const bezierX = t => 3*(1-t)*(1-t)*t*.4 + 3*(1-t)*t*t*.2 + t*t*t;
 const bezierY = t => 3*t*t - 2*t*t*t;
 function invert(fn,value) {
  let low=0,high=1;
  for(let i=0;i<48;i++) { const t=(low+high)/2; if(fn(t)<value) low=t; else high=t; }
  return (low+high)/2;
 }
 function ease(value, x1=.4, x2=.2) {
  if(value<=0) return 0;
  if(value>=1) return 1;
  const x=t=>3*(1-t)*(1-t)*t*x1+3*(1-t)*t*t*x2+t*t*t;
  return bezierY(invert(x,value));
 }
 function cameraAt(ms) {
  return startScale**(1-ease((ms-zoomStart)/zoomDuration));
 }
 function timeAtScale(scale) {
  if(scale===startScale) return zoomStart;
  if(scale===1) return landing;
  return zoomStart+zoomDuration*bezierX(invert(bezierY,1-Math.log(scale)/Math.log(startScale)));
 }
 for(const handoff of handoffs) {
  handoff.start=timeAtScale(handoff.from); handoff.end=timeAtScale(handoff.to);
 }
 function paintingRect(painting,scale) {
  const s=Math.min(scale,painting.maxScale);
  return {x:size.width*(cameraOrigin.x+(painting.x-cameraOrigin.x)*s),
   y:size.height*(cameraOrigin.y+(painting.y-cameraOrigin.y)*s),
   width:size.width*painting.size*s,height:size.height*painting.size*s};
 }
 function composeScreen(painting,ms) {
  const surface=renderer.screenMasks.get(painting.name),context=contextFor(surface);
  const screen=renderer.screens.get(painting.name);
  const key=painting.name==='close'&&ms<510?(ms<=250?'splash':String(ms)):'explore';
  if(surface.dataset.frame===key) return surface;
  surface.dataset.frame=key;
  context.clearRect(0,0,surface.width,surface.height);
  if(key==='explore') context.drawImage(screen,0,0);
  else {
   context.drawImage(renderer.splash,0,0);
   if(ms>250) {
    // Replace the lower half; source-over would leave splash beneath the
    // antialiased screen/finger edges. The two frames never crossfade.
    const t=invert(t=>3*(1-t)*(1-t)*t*.2+3*(1-t)*t*t*.2+t*t*t,(ms-250)/260);
    const progress=3*(1-t)*(1-t)*t*.7+3*(1-t)*t*t+t*t*t;
    const [tl,tr,br,bl]=screenQuads.close,[x,y,width,height]=screenRects.get('close');
    const mix=(a,b)=>[a[0]+(b[0]-a[0])*progress,a[1]+(b[1]-a[1])*progress];
    context.save();context.beginPath();
    [mix(bl,tl),mix(br,tr),br,bl].forEach(([px,py],i)=>context[i?'lineTo':'moveTo']((px-x)*surface.width/width,(py-y)*surface.height/height));
    context.closePath();context.clip();
    context.globalCompositeOperation='copy';context.drawImage(screen,0,0);context.restore();
   }
  }
  // Actual painting pixels cover the glass last, with a one-source-pixel
  // inward feather. Keep the phone opaque instead of fading it radially into
  // the other layers' Explore screens; the existing handoff alpha still runs.
  context.drawImage(renderer.occlusions.get(painting.name),0,0);
  return surface;
 }
 function paintScreen(context,painting,rect,ms) {
  if(!renderer.screens.has(painting.name)) return;
  const screen=composeScreen(painting,ms);
  const [x,y,width,height]=screenRects.get(painting.name);
  const target=[rect.x+rect.width*x/1254,rect.y+rect.height*y/1254,rect.width*width/1254,rect.height*height/1254];
  context.drawImage(screen,...target);
 }
 function feather(context,width,height,cx,cy,rx,ry) {
  context.save();context.translate(cx,cy);context.scale(rx,ry);
  const gradient=context.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,'#000');gradient.addColorStop(.55,'#000');gradient.addColorStop(1,'transparent');
  context.globalCompositeOperation='destination-in';context.fillStyle=gradient;
  context.fillRect(-cx/rx,-cy/ry,width/rx,height/ry);context.restore();
 }
 function paintMasked(painting) {
  const surface=renderer.masks.get(painting.name),context=contextFor(surface),n=surface.width;
  context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,n,n);
  context.drawImage(painting.image,0,0,n,n);
  const cx=painting.anchor[0]*n,cy=painting.anchor[1]*n;
  const rx=Math.min(cx,n-cx),ry=Math.min(cy,n-cy);
  feather(context,n,n,cx,cy,rx,ry);
 }
 function initScreen(painting) {
  // Composite at the screen's full 4x resolution, independently of the
  // feathered painting. All buffers retain the existing landing cleanup.
  const image=renderer.screens.get(painting.name);
  const surface=document.createElement('canvas');
  surface.width=image.naturalWidth;surface.height=image.naturalHeight;
  surface.dataset.screen=painting.name;
  renderer.screenMasks.set(painting.name,surface);
 }
 async function prepareCanvas() {
  if(!canvas) throw new Error('Canvas unavailable');
  const context=contextFor(canvas);
  const inner=paintings.slice(1).map(painting=>{
   const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=painting.src;
   return {...painting,image};
  });
  const screens=new Map(inner.map(p=>{
   const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=`/hero/screen-${p.name}-explore.webp`;
   return [p.name,image];
  }));
  const splash=new Image();splash.decoding='async';splash.fetchPriority='low';splash.src='/hero/screen-close-splash.webp';
  const occlusions=new Map(inner.map(p=>{
   const image=new Image();image.decoding='async';image.fetchPriority='low';image.src=`/hero/screen-${p.name}-occlusion.webp`;
   return [p.name,image];
  }));
  await decoded([...inner.map(p=>p.image),...screens.values(),...occlusions.values(),splash]);
  return {context,paintings:[{...paintings[0],image:pane.querySelector('.city-art')},...inner],screens,splash,occlusions,masks:new Map(),screenMasks:new Map()};
 }
 function initCanvas() {
  const {backingWidth,backingHeight}=measure();
  canvas.width=backingWidth;canvas.height=backingHeight;
  for(const painting of renderer.paintings.slice(1)) {
   const surface=document.createElement('canvas');
   surface.width=surface.height=Math.min(1254,painting.image.naturalWidth,painting.image.naturalHeight);
   surface.dataset.painting=painting.name;
   renderer.masks.set(painting.name,surface);paintMasked(painting);
   initScreen(painting);
  }
 }
 function drawFrame(ms) {
  const context=renderer.context,scale=cameraAt(ms);
  context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  for(const painting of renderer.paintings) {
   const handoff=handoffs.find(h=>h.name===painting.name);
   const alpha=handoff?Math.max(0,Math.min(1,(handoff.end-ms)/(handoff.end-handoff.start))):1;
   if(!alpha) continue;
   const masked=!!handoff&&ms>=handoff.start;
   // Hold every painting solid until its handoff. Introduce the feather
   // under a full painting that eases away over the first 40% of the window.
   const solid=masked?1-ease((ms-handoff.start)/(.4*(handoff.end-handoff.start))):0;
   const rect=paintingRect(painting,scale);
   context.globalAlpha=alpha;
   context.setTransform(size.dx,0,0,size.dy,0,0);
   context.drawImage(masked?renderer.masks.get(painting.name):painting.image,rect.x,rect.y,rect.width,rect.height);
   if(solid>0) {
    context.globalAlpha=solid;
    context.drawImage(painting.image,rect.x,rect.y,rect.width,rect.height);
   }
   // One high-resolution screen pass, with the combined painting opacity.
   // Repainting it between the two passes would mix in the blank glass.
   context.globalAlpha=alpha+(1-alpha)*solid;
   paintScreen(context,painting,rect,ms);
  }
  context.globalAlpha=1;
 }
 function tick(run,startTime,clock) {
  if(run!==generation||!renderer) return;
  try {
   // WAAPI and rAF use the same document.timeline start. Reading its animation
   // clock also keeps paused/seeking host captures and the canvas in lockstep.
   const ms=clock.currentTime??document.timeline.currentTime-startTime;
   drawFrame(Math.min(ms,landing));
   if(ms>=landing) {
    delete pane.dataset.zoom;
    canvas.hidden=true;canvas.width=canvas.height=0;freeMasks();frame=0;
   } else frame=requestAnimationFrame(()=>tick(run,startTime,clock));
  } catch { rest(); }
 }
 function arrival(destination) {
  const radius=Math.hypot(Number(destination.dataset.x)-origin.x,Number(destination.dataset.y)-origin.y)*10;
  return radarStart+radius/radarRadius*(radarEnd-radarStart);
 }
 async function play() {
  rest();
  if(disposed||document.hidden||motion.matches||document.documentElement.dataset.motion!=='on'||typeof pane.animate!=='function') return;
  const run=generation;
  pane.dataset.state='preparing';
  replay.disabled=true;
  try {
   await artwork;
   if(run!==generation||disposed||document.hidden||motion.matches) return;
   const prepared=await prepareCanvas();
   if(run!==generation||disposed||document.hidden||motion.matches) return;
   renderer=prepared;initCanvas();drawFrame(0);
   canvas.hidden=false;pane.dataset.zoom='active';pane.dataset.state='playing';
   const finish=animate(pane.querySelector('.city-base'),[
    at(0,{filter:'none'}),at(fogStart,{filter:'none'}),
    at(radarStart,{filter:'saturate(.65) brightness(.96)'}),
    at(colourReturn,{filter:'saturate(.65) brightness(.96)'},'ease-out'),
    at(duration,{filter:'saturate(.85) brightness(1)'})
   ]);
   animate(pane.querySelector('.radar-ring'),[
    at(0,{transform:'scale(0)',opacity:0}),at(radarStart,{transform:'scale(0)',opacity:.9}),
    at(radarEnd,{transform:'scale(1)',opacity:0}),at(duration,{transform:'scale(1)',opacity:0})
   ]);
   const starts=new Map();
   for(const destination of pane.querySelectorAll('.destination')) {
    const start=arrival(destination); starts.set(destination.dataset.id,start);
    destination.dataset.arrival=String(start);
    animate(destination.querySelector('.light-beam'),[
     at(0,{opacity:0,transform:'scaleY(0)'}),at(start,{opacity:0,transform:'scaleY(0)'}),
     at(start+45,{opacity:.95,transform:'scaleY(1)'}),at(start+250,{opacity:0,transform:'scaleY(1.1)'}),
     at(duration,{opacity:0,transform:'scaleY(1.1)'})
    ]);
    animate(destination.querySelector('.masjid-sprite'),[
     at(0,{opacity:0,transform:'translateY(22px) scale(0)'}),
     at(start+30,{opacity:0,transform:'translateY(22px) scale(0)'},'cubic-bezier(.15,.8,.25,1)'),
     at(start+175,{opacity:1,transform:'translateY(-4px) scale(1.12)'}),
     at(start+240,{opacity:1,transform:'translateY(0) scale(1)'}),at(duration,{opacity:1,transform:'translateY(0) scale(1)'})
    ]);
    animate(destination.querySelector('.masjid-sprite'),[
     at(0,{filter:'drop-shadow(0 0 0px #ffcc0000)'}),at(start+200,{filter:'drop-shadow(0 0 0px #ffcc0000)'}),
     at(start+340,{filter:'drop-shadow(0 0 2px #ffcc0090) drop-shadow(0 3px 4px #00313024)'}),
     at(duration,{filter:'drop-shadow(0 0 2px #ffcc0090) drop-shadow(0 3px 4px #00313024)'})
    ]);
    animate(destination.querySelector('.shockwave'),[
     at(0,{opacity:0,transform:'scale(.1)'}),at(start+100,{opacity:0,transform:'scale(.1)'}),
     at(start+160,{opacity:.9,transform:'scale(.5)'}),at(start+380,{opacity:0,transform:'scale(1.6)'}),
     at(duration,{opacity:0,transform:'scale(1.6)'})
    ]);
    animate(destination.querySelector('.pin'),[
     at(0,{opacity:0,transform:'translateY(-25px) scale(.7)'}),at(start+230,{opacity:0,transform:'translateY(-25px) scale(.7)'},'ease-out'),
     at(start+325,{opacity:1,transform:'translateY(3px) scale(1.08)'}),at(start+360,{opacity:1,transform:'translateY(0) scale(1)'}),
     at(duration,{opacity:1,transform:'translateY(0) scale(1)'})
    ]);
    animate(destination.querySelector('.distance'),[
     at(0,{opacity:0,transform:'translateY(5px) scale(.8)'}),at(start+320,{opacity:0,transform:'translateY(5px) scale(.8)'},'ease-out'),
     at(start+400,{opacity:1,transform:'translateY(0) scale(1)'}),at(duration,{opacity:1,transform:'translateY(0) scale(1)'})
    ]);
   }
   for(const path of pane.querySelectorAll('.path-reveal')) {
    const start=starts.get(path.dataset.target);
    animate(path,[at(0,{strokeDashoffset:1}),at(start,{strokeDashoffset:1}),at(start+400,{strokeDashoffset:0}),at(duration,{strokeDashoffset:0})]);
   }
   animate(pane.querySelector('.origin'),[at(0,{opacity:0}),at(landing-150,{opacity:0}),at(landing,{opacity:1}),at(duration,{opacity:1})]);
   animate(pane.querySelector('.floating-phone'),[
    at(0,{opacity:0,transform:'translate(18px,calc(-50% + 30px)) rotate(9deg) scale(.9)'}),
    at(colourReturn,{opacity:0,transform:'translate(18px,calc(-50% + 30px)) rotate(9deg) scale(.9)'},'cubic-bezier(.2,.7,.2,1)'),
    at(3580,{opacity:1,transform:'translate(0,-50%) rotate(9deg) scale(1)'}),at(duration,{opacity:1,transform:'translate(0,-50%) rotate(9deg) scale(1)'})
   ]);
   const startTime=document.timeline.currentTime;
   animations.forEach(animation=>{animation.startTime=startTime;});
   remember();
   frame=requestAnimationFrame(()=>tick(run,startTime,finish));
   await finish.finished;
   if(run===generation) rest();
  } catch { if(run===generation) rest(); }
 }
 const onMotion = () => { rest(); if (!motion.matches) artwork.then(paintRest).catch(restoreFallback); };
 const onVisibility = () => { if (document.hidden) rest(); };
 const onResize = () => {
  try {
   // Cancel the current composition before resizing to avoid mismatched clocks.
   rest();
   artwork.then(paintRest).catch(restoreFallback);
  } catch { restoreFallback(); rest(); }
 };
 const onPageHide = () => { disposed=true; rest(); };
 const onPageShow = event => { if (event.persisted) { disposed=false; rest(); artwork.then(paintRest).catch(restoreFallback); } };
 replay.addEventListener('click',play);
 motion.addEventListener('change',onMotion);
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('resize',onResize);
 window.addEventListener('pagehide',onPageHide);
 window.addEventListener('pageshow',onPageShow);
 if(!motion.matches&&!seen()) play(); else rest();
 return () => {
  disposed=true; rest();
  replay.removeEventListener('click',play);
  motion.removeEventListener('change',onMotion);
  document.removeEventListener('visibilitychange',onVisibility);
  window.removeEventListener('resize',onResize);
  window.removeEventListener('pagehide',onPageHide);
  window.removeEventListener('pageshow',onPageShow);
  pane.classList.remove('canvas-art');
  for (const surface of pane.querySelectorAll('canvas')) surface.width=surface.height=0;
 };
}
