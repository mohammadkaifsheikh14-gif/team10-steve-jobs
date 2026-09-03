let selectedRating=0, allReviews=[];
const $=id=>document.getElementById(id);

window.addEventListener("scroll",()=>{
 const max=document.documentElement.scrollHeight-innerHeight;
 $("progress").style.width=(max>0?(scrollY/max)*100:0)+"%";
});
document.addEventListener("mousemove",e=>{
 const g=$("cursorGlow"); if(g){g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";}
});
const observer=new IntersectionObserver(entries=>entries.forEach(x=>x.isIntersecting&&x.target.classList.add("visible")),{threshold:.12});
document.querySelectorAll(".reveal").forEach(x=>observer.observe(x));

document.querySelectorAll(".tilt").forEach(card=>{
 card.addEventListener("pointermove",e=>{
  const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
  card.style.transform=`perspective(900px) rotateX(${y*-5}deg) rotateY(${x*5}deg) translateY(-7px)`;
 });
 card.addEventListener("pointerleave",()=>card.style.transform="");
});

async function loadData(){
 try{
  const [a,b]=await Promise.all([fetch("/api/reviews"),fetch("/api/statistics")]);
  allReviews=await a.json(); const s=await b.json(); renderStats(s); renderReviews();
 }catch(e){$("reviewsGrid").innerHTML='<div class="empty">Could not load the review wall. Refresh and try again.</div>';}
}
function renderStats(s){
 $("heroAverage").textContent=s.total?s.average:"—"; $("heroTotal").textContent=s.total;
 $("averageRating").textContent=s.total?s.average:"—"; $("reviewCount").textContent=s.total;
 const n=Math.round(s.average||0); $("averageStars").textContent="★".repeat(n)+"☆".repeat(5-n);
 for(let i=1;i<=5;i++) $("bar"+i).style.width=(s.total?s.distribution[i]/s.total*100:0)+"%";
}
function safe(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function renderReviews(){
 const f=$("reviewFilter").value, list=f==="all"?allReviews:allReviews.filter(r=>r.product===f);
 if(!list.length){$("reviewsGrid").innerHTML='<div class="empty">No reviews yet. Be the first legend. ⭐</div>';return;}
 $("reviewsGrid").innerHTML=list.map(r=>`<article class="review-card reveal visible"><div class="review-top"><div class="avatar">${safe(r.name[0]?.toUpperCase()||"?")}</div><div><strong>${safe(r.name)}</strong><small>${safe(r.created_at)}</small></div><span class="badge">${safe(r.product)}</span></div><div class="review-stars">${"★".repeat(r.rating)}<span>${"★".repeat(5-r.rating)}</span></div><p>“${safe(r.comment)}”</p></article>`).join("");
}
$("reviewFilter").addEventListener("change",renderReviews);

document.querySelectorAll(".product-picker button").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".product-picker button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("product").value=b.dataset.product;
}));
document.querySelectorAll(".stars button").forEach(b=>b.addEventListener("click",()=>{
 selectedRating=+b.dataset.rating;$("rating").value=selectedRating;
 document.querySelectorAll(".stars button").forEach(x=>x.classList.toggle("active",+x.dataset.rating<=selectedRating));
}));
$("comment").addEventListener("input",e=>$("charCount").textContent=e.target.value.length);

$("reviewForm").addEventListener("submit",async e=>{
 e.preventDefault();const data={name:$("name").value.trim(),contact:$("contact").value.trim(),product:$("product").value,rating:selectedRating,comment:$("comment").value.trim()};
 if(!data.name||!data.product||!data.rating||!data.comment){toast("Complete all required fields.",true);return;}
 const btn=e.target.querySelector(".submit-btn");btn.disabled=true;btn.innerHTML="PUBLISHING…";
 try{const r=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not submit");toast("Published! Team #10 says THANK YOU. ❤️");confetti();e.target.reset();selectedRating=0;document.querySelectorAll(".stars button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".product-picker button").forEach(x=>x.classList.remove("selected"));$("charCount").textContent="0";await loadData();document.querySelector("#reviews").scrollIntoView({behavior:"smooth"});}
 catch(err){toast(err.message,true)}finally{btn.disabled=false;btn.innerHTML="PUBLISH MY REVIEW <span>↗</span>";}
});

const memes=[
["ME: I'LL JUST TASTE IT","😐","🤤","ALSO ME: ORDER ANOTHER."],
["FRIEND: SHARE THE NACHOS","🙂","😈","ME: DEFINE “SHARE”."],
["PROFESSOR: WHY ARE YOU LATE?","🏃","🧀","ME: IMPORTANT ACADEMIC RESEARCH."],
["EXAM TOMORROW","📚","🥤","ME: FIRST, A GUAVA SHOT."],
["BANK BALANCE: ₹0","💸","🌽","ME: STILL BUYING NACHOS."],
["TEAM #10 SAID IT'S SPICY","😏","🔥","ME: HOW SPICY CAN IT BE?"],
["I'M NOT HUNGRY","🙄","🍴","5 MINUTES LATER: HALF MY FRIEND'S PLATE."],
["JUST ONE BITE","😎","🤡","30 SECONDS LATER: ANOTHER ORDER."]
];
function generateMeme(){
 let m=memes[Math.floor(Math.random()*memes.length)];
 $("memeTop").textContent=m[0];$("memeFace1").textContent=m[1];$("memeFace2").textContent=m[2];$("memeBottom").textContent=m[3];
 $("memeCard").animate([{transform:"rotate(2deg) scale(.94)"},{transform:"rotate(-1deg) scale(1.03)"},{transform:"rotate(2deg) scale(1)"}],{duration:450});
}
$("memeGenerate").addEventListener("click",generateMeme);
$("memeShare").addEventListener("click",async()=>{
 const text=`${$("memeTop").textContent}\n${$("memeFace1").textContent} → ${$("memeFace2").textContent}\n${$("memeBottom").textContent}\nTeam #10 — Steve Jobs`;
 if(navigator.share){try{await navigator.share({title:"Team #10 Meme",text})}catch(e){}}
 else{try{await navigator.clipboard.writeText(text);toast("Meme copied to clipboard!")}catch(e){toast(text)}}
});
function toast(msg,error=false){const t=$("toast");t.textContent=msg;t.className="toast show"+(error?" error":"");setTimeout(()=>t.classList.remove("show"),3200)}
function confetti(){
 for(let i=0;i<28;i++){let s=document.createElement("span");s.textContent=["★","✦","❤","●"][Math.floor(Math.random()*4)];s.style.cssText=`position:fixed;left:${50+(Math.random()*20-10)}%;top:48%;z-index:160;color:#e50914;font-size:${12+Math.random()*18}px;pointer-events:none;--x:${(Math.random()*2-1)*280}px;--y:${-(100+Math.random()*260)}px;animation:cf .9s ease-out forwards`;document.body.appendChild(s);setTimeout(()=>s.remove(),950)}
}
const st=document.createElement("style");st.textContent="@keyframes cf{to{transform:translate(var(--x),var(--y)) rotate(540deg);opacity:0}}";document.head.appendChild(st);

// --- Snack Smash mini-game ---
const gameArena=$("gameArena"), gameIntro=$("gameIntro"), gameWin=$("gameWin"), gameLose=$("gameLose");
let gameHits=0, gameTime=10, gameInterval=null, gameStarted=false, gameEnded=false;
const snackIcons=["🧀","🌽","🥤","🍟","🍕","🌶️","🍿","🍔","🍪"];
function spawnSnack(){
 if(!gameStarted||gameEnded)return;
 const el=document.createElement("button");el.type="button";el.className="snack-target";el.textContent=snackIcons[Math.floor(Math.random()*snackIcons.length)];
 const rect=gameArena.getBoundingClientRect();
 el.style.left=Math.max(2,Math.min(92,Math.random()*90))+"%";
 el.style.top=Math.max(8,Math.min(84,Math.random()*76))+"%";
 el.addEventListener("click",()=>{if(el.classList.contains("hit"))return;gameHits++;$("gameHits").textContent=gameHits;el.classList.add("hit");setTimeout(()=>el.remove(),260);if(gameHits>=25)finishGame(true);});
 gameArena.appendChild(el);setTimeout(()=>el.remove(),1400);
}
function startGame(){
 if(gameStarted)return;gameStarted=true;gameEnded=false;gameHits=0;gameTime=10;$("gameHits").textContent="0";$("gameTimer").textContent="10.0";gameArena.classList.add("game-playing");
 gameInterval=setInterval(()=>{gameTime-=.1;$("gameTimer").textContent=Math.max(0,gameTime).toFixed(1);if(gameTime<=0)finishGame(false);},100);
 const sp=setInterval(()=>{if(gameEnded){clearInterval(sp);return}spawnSnack();},300);spawnSnack();
}
async function finishGame(completed){
 if(gameEnded)return;gameEnded=true;clearInterval(gameInterval);document.querySelectorAll(".snack-target").forEach(x=>x.remove());gameArena.classList.remove("game-playing");
 if(!completed){gameIntro.hidden=false;gameIntro.innerHTML='<div class="lose-icon">⏰</div><h3>TIME! THE SNACK ESCAPED.</h3><p>You needed 25 hits. The boss is laughing.</p><button class="btn red" type="button" onclick="location.reload()">TRY AGAIN ↻</button>';return;}
 try{
  const r=await fetch("/api/game/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({hits:gameHits})});
  const data=await r.json();if(!r.ok)throw Error(data.error||"Game unavailable");
  gameIntro.hidden=true;
  if(data.won){$("discountCode").textContent=data.discount_code;gameWin.hidden=false;confetti();}
  else{gameLose.hidden=false;}
 }catch(err){toast(err.message,true);gameIntro.hidden=false;}
}
$("gameStart").addEventListener("click",startGame);
$("gameDone").addEventListener("click",()=>$("review").scrollIntoView({behavior:"smooth"}));
$("playAgain").addEventListener("click",()=>$("review").scrollIntoView({behavior:"smooth"}));

loadData();
