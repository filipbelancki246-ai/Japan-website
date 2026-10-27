/* Shining Dining — расширение (только фронтенд): защита от XSS, menu.json, категории, доставка, поиск, отзывы, PWA/бейджи/описания,
   акции и промокоды, контакты, заказ в Telegram. Подключается ОДНОЙ строкой, см. SETUP.md */
(function(){
"use strict";

/* ======== НАСТРОЙКИ: контакты ======== */
var CONFIG={
  DELIVERY:{fee:3000,freeFrom:30000,min:15000}, // доставка: цена, бесплатно от суммы, минимальный заказ (₩)
  HOURS:{open:'10:00',close:'22:00',tz:'Asia/Seoul'}, // для метки «Сейчас открыто»
  CONTACT:{
    phone:'+82 10-0000-0000',
    email:'hello@shiningdining.example',
    telegram:'Ordison',
    address:'Seoul, Gangnam-gu, Teheran-ro 000',
    hours:'10:00 – 22:00'
  }
};
var C=CONFIG, LS=window.localStorage;
var _get=Storage.prototype.getItem,_set=Storage.prototype.setItem;
function $(id){return document.getElementById(id)}
function rd(k,d){try{var v=_get.call(LS,k);return v?JSON.parse(v):d}catch(e){return d}}
function wr(k,v){try{_set.call(LS,k,JSON.stringify(v))}catch(e){}}
function lang(){return (document.documentElement.lang||'ru').slice(0,2)}

/* ======== 1. Защита от XSS: чистим меню при каждом чтении ======== */
function esc(s){return String(s==null?'':s).replace(/[<>"']/g,function(c){return{'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function cleanList(a){return (Array.isArray(a)?a:[]).map(function(i){
  var img=String(i.img||'');
  return{id:esc(i.id),kor:esc(i.kor),key:esc(i.key),customName:i.customName?esc(i.customName):undefined,
    price:Number(i.price)||0,img:okImg(img)?esc(img):''}})}
Storage.prototype.getItem=function(k){
  var v=_get.call(this,k);
  if(this===LS&&k==='sd_food_items'&&v){try{return JSON.stringify(cleanList(JSON.parse(v)))}catch(e){return null}}
  return v};

/* ======== Тексты ======== */
var X={
ru:{all:'Все',hot:'Горячее',sushi:'Суши',soup:'Супы',rice:'Рис и боксы',other:'Другое',hit:'Хит',new:'Новинка',spicy:'Острое',vegan:'Веган',pe:'PROMOTIONS',pt:'Акции и промокоды',ph:'Нажмите на карточку, чтобы применить код',cp:'Код выбран',pph:'Промокод',pap:'Применить',pok:'Промокод применён',pbad:'Промокод не найден',pd:'Скидка',pf:'К оплате',ct:'Контакты',cph:'Телефон',cem:'Почта',cad:'Адрес',chr:'Часы работы',ctg:'Telegram',tgs:'Отправить заказ в Telegram'},
uk:{all:'Усі',hot:'Гаряче',sushi:'Суші',soup:'Супи',rice:'Рис і бокси',other:'Інше',hit:'Хіт',new:'Новинка',spicy:'Гостре',vegan:'Веган',pe:'PROMOTIONS',pt:'Акції та промокоди',ph:'Натисніть на картку, щоб застосувати код',cp:'Код обрано',pph:'Промокод',pap:'Застосувати',pok:'Промокод застосовано',pbad:'Промокод не знайдено',pd:'Знижка',pf:'До сплати',ct:'Контакти',cph:'Телефон',cem:'Пошта',cad:'Адреса',chr:'Години роботи',ctg:'Telegram',tgs:'Надіслати замовлення в Telegram'},
en:{all:'All',hot:'Hot dishes',sushi:'Sushi',soup:'Soups',rice:'Rice & boxes',other:'Other',hit:'Popular',new:'New',spicy:'Spicy',vegan:'Vegan',pe:'PROMOTIONS',pt:'Promotions & promo codes',ph:'Tap a card to use its code',cp:'Code selected',pph:'Promo code',pap:'Apply',pok:'Promo code applied',pbad:'Promo code not found',pd:'Discount',pf:'To pay',ct:'Contacts',cph:'Phone',cem:'Email',cad:'Address',chr:'Opening hours',ctg:'Telegram',tgs:'Send order via Telegram'},
ja:{all:'すべて',hot:'温かい料理',sushi:'寿司',soup:'スープ',rice:'ご飯・弁当',other:'その他',hit:'人気',new:'新作',spicy:'辛口',vegan:'ヴィーガン',pe:'PROMOTIONS',pt:'キャンペーンとプロモコード',ph:'カードをタップしてコードを使用',cp:'コードを選択しました',pph:'プロモコード',pap:'適用',pok:'プロモコードを適用しました',pbad:'コードが見つかりません',pd:'割引',pf:'お支払い額',ct:'お問い合わせ',cph:'電話',cem:'メール',cad:'住所',chr:'営業時間',ctg:'Telegram',tgs:'Telegramで注文を送信'}};
function t(k){return (X[lang()]||X.ru)[k]||X.en[k]||k}
function L(o){return typeof o==='string'?o:(o&&(o[lang()]||o.en||o.ru))||''}
function f(n){var l={ru:'ru-RU',uk:'uk-UA',en:'en-US',ja:'ja-JP'}[lang()]||'en-US';try{return Number(n).toLocaleString(l)+' ₩'}catch(e){return n+' ₩'}}
function toast(m){var s=$('toast-stack'),e=document.createElement('div');e.className='toast';e.innerHTML='<span class="dot"></span><span></span>';e.lastChild.textContent=m;s.appendChild(e);
  requestAnimationFrame(function(){e.classList.add('show')});setTimeout(function(){e.classList.remove('show');setTimeout(function(){e.remove()},400)},2800)}

/* ======== Данные: категории, бейджи, описания, акции ======== */
var DM={ // метаданные стандартных блюд (проверьте бейджи — они ориентировочные)
 steak:{c:'hot',b:['hit'],d:{ru:'Сочный стейк на гриле с овощами',en:'Juicy grilled steak with vegetables'}},
 ramen:{c:'soup',b:['spicy'],d:{ru:'Насыщенный бульон, лапша и топпинги',en:'Rich broth, noodles and toppings'}},
 sushi:{c:'sushi',b:['new'],d:{ru:'Ассорти свежих суши от шефа',en:"Chef's assortment of fresh sushi"}},
 bibimbap:{c:'rice',b:[],d:{ru:'Рис с овощами, мясом и пастой кочудян',en:'Rice with vegetables, meat and gochujang'}},
 mushroom:{c:'hot',b:['vegan'],d:{ru:'Грибы с дымным ароматом углей',en:'Mushrooms with a smoky charcoal aroma'}},
 bento:{c:'rice',b:['hit'],d:{ru:'Сбалансированный обед в боксе',en:'A balanced lunch in a box'}}};
var NM={steak:'Стейк на гриле',ramen:'Рамен',sushi:'Свежие суши',bibimbap:'Бибимбап',mushroom:'Грибы на углях',bento:'Бенто-бокс'};
var PROMOS=[
 {code:'WELCOME10',pct:10,t:{ru:'−10% на первый заказ',en:'10% off your first order'},d:{ru:'Для новых гостей. Введите код в корзине.',en:'For new guests. Enter the code in your cart.'}},
 {code:'LUNCH15',pct:15,t:{ru:'−15% на бенто-боксы',en:'15% off bento boxes'},d:{ru:'Обеденное предложение. Введите код в корзине.',en:'Lunch offer. Enter the code in your cart.'}}];
function meta(id){return rd('sd_meta',{})[id]||DM[id]||{c:'other',b:[],d:''}}

/* ======== Стили ======== */
var st=document.createElement('style');
st.textContent='#sd-cats{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px}.sd-chip{border:1px solid rgba(127,154,79,.4);background:var(--surface);color:var(--text);padding:8px 16px;border-radius:22px;font-weight:700;font-size:13px;cursor:pointer}.sd-chip.on{background:var(--green);color:#fff;border-color:var(--green)}'+
'.sd-badges{position:absolute;top:10px;left:10px;display:flex;gap:6px;flex-wrap:wrap;z-index:1}.sd-badge{background:#262626;color:#fff;font-size:11px;font-weight:700;padding:4px 9px;border-radius:12px}.sd-badge.hit{background:#c8553d}.sd-badge.new{background:var(--green)}.sd-badge.spicy{background:#d9822b}.sd-badge.vegan{background:#4f8a4b}'+
'.sd-desc{color:var(--muted);font-size:12.5px;line-height:1.5;margin:8px 0 0}'+
'.sd-promos{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}.sd-promo-card{background:var(--surface);border:2px dashed rgba(127,154,79,.5);border-radius:16px;padding:24px;cursor:pointer;transition:transform .25s var(--ease)}.sd-promo-card:hover{transform:translateY(-4px)}.sd-pct{font-family:"Playfair Display",serif;font-size:44px;color:var(--green);font-weight:700}.sd-promo-card h4{margin:6px 0}.sd-promo-card p{color:var(--muted);font-size:13px;line-height:1.5}.sd-code{display:inline-block;margin-top:8px;padding:6px 12px;border-radius:8px;background:rgba(127,154,79,.15);font-family:monospace;font-weight:700;letter-spacing:1px}'+
'.sd-contacts{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:18px;margin-top:20px}.sd-ct{background:var(--surface);border-radius:14px;padding:20px;box-shadow:var(--shadow)}.sd-ct small{display:block;color:var(--green);font-weight:700;letter-spacing:1px;font-size:12px;margin-bottom:8px}.sd-ct a{text-decoration:none;font-weight:700}'+
'#sd-promo{margin-bottom:14px}.sd-prow{display:flex;gap:8px}.sd-prow input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:var(--bg);color:var(--text);text-transform:uppercase;font-family:inherit}.sd-prow button{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}#sd-pmsg{font-size:12.5px;color:var(--green);margin-top:6px}.sd-line{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:var(--muted)}.sd-line.b{font-weight:700;color:var(--text);font-size:15px}';
document.head.appendChild(st);

/* ======== 3. Меню: категории, бейджи, описания ======== */
var grid=$('food-grid'),filter='all',q='',favOnly=false,bar=document.createElement('div');
bar.id='sd-cats';grid.parentNode.insertBefore(bar,grid);
function favs(){return rd('sd_fav',[])}
function visible(x){
  if(filter!=='all'&&x.dataset.cat!==filter)return false;
  if(favOnly&&favs().indexOf(x.dataset.id)<0)return false;
  return !q||x.textContent.toLowerCase().indexOf(q)>=0}
function applyFilter(){grid.querySelectorAll('figure.food').forEach(function(x){x.style.display=visible(x)?'':'none'})}
function chip(label,on,fn){var b=document.createElement('button');b.type='button';b.className='sd-chip'+(on?' on':'');b.textContent=label;b.onclick=fn;bar.appendChild(b)}
function renderBar(){
  var present={};grid.querySelectorAll('figure.food').forEach(function(x){present[x.dataset.cat]=1});
  var cats=['all'].concat(['hot','sushi','soup','rice','other'].filter(function(c){return present[c]}));
  if(cats.indexOf(filter)<0)filter='all';
  bar.innerHTML='';
  var i=document.createElement('input');i.type='search';i.className='sd-search';i.placeholder=t('n_search');i.setAttribute('aria-label',t('n_search'));i.value=q;
  i.oninput=function(){q=i.value.trim().toLowerCase();applyFilter()};bar.appendChild(i);
  if(cats.length>=3)cats.forEach(function(c){chip(t(c),c===filter,function(){filter=c;renderBar();applyFilter()})});
  chip('♥ '+t('n_fav'),favOnly,function(){favOnly=!favOnly;renderBar();applyFilter()})}
function decorate(){
  grid.querySelectorAll('figure.food').forEach(function(x){
    var b=x.querySelector('[data-add]');if(!b||x.dataset.sd)return;x.dataset.sd='1';
    var id=b.getAttribute('data-add'),m=meta(id),w=x.querySelector('.imgwrap');x.dataset.id=id;x.dataset.cat=m.c||'other';
    if(m.b&&m.b.length){var bw=document.createElement('div');bw.className='sd-badges';
      m.b.forEach(function(k){var s=document.createElement('span');s.className='sd-badge '+k;s.textContent=t(k);bw.appendChild(s)});w.appendChild(bw)}
    var h=document.createElement('button');h.type='button';h.className='sd-heart';h.setAttribute('aria-label',t('n_fav'));
    function paint(){var on=favs().indexOf(id)>=0;h.textContent=on?'♥':'♡';h.classList.toggle('on',on);h.setAttribute('aria-pressed',on)}
    h.onclick=function(e){e.stopPropagation();var a=favs(),k=a.indexOf(id);if(k<0)a.push(id);else a.splice(k,1);wr('sd_fav',a);paint();applyFilter()};
    paint();w.appendChild(h);
    var d=L(m.d);if(d){var p=document.createElement('p');p.className='sd-desc';p.textContent=d;x.querySelector('.korean').insertAdjacentElement('afterend',p)}
  });renderBar();applyFilter()}
new MutationObserver(decorate).observe(grid,{childList:true});

/* общее модальное окно + выбор остроты при добавлении острых блюд */
var sm=document.createElement('div');sm.className='modal';sm.id='sd-modal';sm.setAttribute('role','dialog');sm.setAttribute('aria-modal','true');document.body.appendChild(sm);
function closeM(){sm.classList.remove('show');$('overlay').classList.remove('show')}
function openM(node){sm.innerHTML='';var x=document.createElement('button');x.type='button';x.className='icon-btn modal-close';x.setAttribute('aria-label','Close');x.textContent='✕';x.onclick=closeM;sm.appendChild(x);sm.appendChild(node);sm.classList.add('show');$('overlay').classList.add('show')}
$('overlay').addEventListener('click',closeM);
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeM()});
var optBypass=false;
grid.addEventListener('click',function(e){
  if(optBypass)return;var b=e.target.closest('[data-add]');if(!b)return;
  var id=b.getAttribute('data-add');if((meta(id).b||[]).indexOf('spicy')<0)return;
  e.stopPropagation();e.preventDefault();
  var n=document.createElement('div');n.innerHTML='<h2></h2><div class="sub"></div>';n.children[0].textContent=t('n_spice');n.children[1].textContent=b.closest('figure').querySelector('.en').textContent;
  [0,1,2].forEach(function(k){var o=document.createElement('button');o.type='button';o.className='ghost-btn';o.textContent=t('n_s'+k);
    o.onclick=function(){var nt=rd('sd_notes',{});nt[id]=t('n_spice')+': '+t('n_s'+k);wr('sd_notes',nt);closeM();optBypass=true;b.click();optBypass=false};n.appendChild(o)});
  openM(n)},true);

/* поля категории/описания/бейджей в админке */
var pending=null,af=$('admin-food-form');
if(af){
  var h='<div class="field"><label>Категория</label><select id="admin-cat"><option value="hot">Горячее</option><option value="sushi">Суши</option><option value="soup">Супы</option><option value="rice">Рис и боксы</option><option value="other">Другое</option></select></div>'+
   '<div class="field"><label>Описание</label><input id="admin-desc" type="text" placeholder="Коротко о блюде"></div>'+
   '<div class="field"><label>Бейджи</label><div style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px">'+
   ['hit:Хит','new:Новинка','spicy:Острое','vegan:Веган'].map(function(s){s=s.split(':');return '<label style="display:flex;gap:5px;align-items:center;margin:0"><input type="checkbox" class="sd-bx" value="'+s[0]+'" style="width:auto"> '+s[1]+'</label>'}).join('')+'</div></div>';
  af.querySelector('button[type=submit]').insertAdjacentHTML('beforebegin',h);
  af.addEventListener('submit',function(){pending={c:$('admin-cat').value,d:$('admin-desc').value.trim(),b:[].map.call(af.querySelectorAll('.sd-bx:checked'),function(x){return x.value})}});
}
Storage.prototype.setItem=function(k,v){
  _set.call(this,k,v);
  if(this!==LS||k!=='sd_food_items')return;
  try{var ms=rd('sd_meta',{}),ch=false;
    JSON.parse(v).forEach(function(i){if(!ms[i.id]&&!DM[i.id]&&pending){ms[i.id]=pending;pending=null;ch=true}});
    if(ch)wr('sd_meta',ms)}catch(e){}
  if($('admin-panel').classList.contains('show'))wr('sd_dirty',1)};

/* ======== 2. menu.json: общее меню без сервера ======== */
function exportMenu(){
  var d={items:cleanList(rd('sd_food_items',[])),meta:rd('sd_meta',{}),promos:PROMOS,reviews:EX.reviews,gallery:EX.gallery},a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download='menu.json';a.click();
  try{LS.removeItem('sd_dirty')}catch(e){}toast('menu.json скачан — загрузите его на хостинг рядом с index.html')}
$('admin-food-list').insertAdjacentHTML('afterend','<button class="primary-btn" id="sd-export" type="button" style="margin-top:14px">⬇ Скачать menu.json</button><div class="admin-note">Загрузите скачанный файл на хостинг рядом с index.html — так новое меню и акции увидят все посетители.</div>');
$('sd-export').onclick=exportMenu;
function pull(){
  fetch('menu.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(m){
    if(Array.isArray(m.promos)){PROMOS=m.promos;renderPromos();updatePromoUI()}
    if(!rd('sd_dirty',0)){if(Array.isArray(m.reviews))EX.reviews=m.reviews;if(Array.isArray(m.gallery))EX.gallery=m.gallery;wr('sd_extra',EX);renderExtra();renderAdminEx()}
    if(Array.isArray(m.items)&&!rd('sd_dirty',0)){
      var same=JSON.stringify(cleanList(m.items))===JSON.stringify(cleanList(rd('sd_food_items',[])))&&JSON.stringify(m.meta||{})===JSON.stringify(rd('sd_meta',{}));
      if(!same){wr('sd_food_items',m.items);wr('sd_meta',m.meta||{});
        if(!sessionStorage.getItem('sd_rl')){sessionStorage.setItem('sd_rl','1');location.reload()}}}
  }).catch(function(){})}

/* ======== 4. Акции и промокоды ======== */
var ps=document.createElement('section');ps.className='gallery';ps.id='promos';
ps.innerHTML='<div class="container"><div class="title"><div><h3 id="sd-pe"></h3><h2 id="sd-pt"></h2></div><div style="color:var(--muted)" id="sd-ph"></div></div><div class="sd-promos" id="sd-promos"></div></div>';
$('menu').insertAdjacentElement('afterend',ps);
var pr=document.createElement('div');pr.id='sd-promo';
pr.innerHTML='<div class="sd-prow"><input id="sd-pin" type="text" autocomplete="off"><button id="sd-pbtn" type="button"></button></div><div id="sd-pmsg"></div><div id="sd-pcalc"></div>';
$('cart-foot').insertBefore(pr,$('btn-checkout'));

function activePromo(){var c=String(rd('sd_promo','')).toUpperCase();return c?PROMOS.filter(function(p){return String(p.code).toUpperCase()===c})[0]||null:null}
function calc(){
  var items=cleanList(rd('sd_food_items',[])),cart=rd('sd_cart',{}),sum=0,list=[];
  Object.keys(cart).forEach(function(id){var it=items.filter(function(i){return i.id===id})[0];if(!it)return;sum+=it.price*cart[id];list.push({id:id,name:it.customName||NM[id]||id,qty:cart[id],price:it.price})});
  var p=activePromo(),disc=p?Math.round(sum*p.pct/100):0;return{list:list,sum:sum,p:p,disc:disc}}
function line(a,b,bold){var d=document.createElement('div');d.className='sd-line'+(bold?' b':'');d.innerHTML='<span></span><span></span>';d.children[0].textContent=a;d.children[1].textContent=b;return d}
function updatePromoUI(){
  var c=calc(),m=$('sd-pmsg'),k=$('sd-pcalc');$('sd-pin').placeholder=t('pph');$('sd-pbtn').textContent=t('pap');k.innerHTML='';
  if(c.p){m.textContent='✓ '+t('pok')+': '+c.p.code+' (−'+c.p.pct+'%)';if(c.sum>0){k.appendChild(line(t('pd'),'−'+f(c.disc)));k.appendChild(line(t('pf'),f(c.sum-c.disc),true))}}
  else m.textContent=''}
function renderPromos(){
  $('sd-pe').textContent=t('pe');$('sd-pt').textContent=t('pt');$('sd-ph').textContent=t('ph');
  var box=$('sd-promos');box.innerHTML='';
  PROMOS.forEach(function(p){var d=document.createElement('div');d.className='sd-promo-card';d.innerHTML='<div class="sd-pct"></div><h4></h4><p></p><span class="sd-code"></span>';
    d.querySelector('.sd-pct').textContent='−'+p.pct+'%';d.querySelector('h4').textContent=L(p.t);d.querySelector('p').textContent=L(p.d);d.querySelector('.sd-code').textContent=p.code;
    d.onclick=function(){$('sd-pin').value=p.code;$('sd-pbtn').click()};box.appendChild(d)})}
$('sd-pbtn').onclick=function(){
  var v=$('sd-pin').value.trim().toUpperCase();
  if(!v){wr('sd_promo','');updatePromoUI();return}
  var p=PROMOS.filter(function(x){return String(x.code).toUpperCase()===v})[0];
  if(!p){toast(t('pbad'));return}
  wr('sd_promo',p.code);updatePromoUI();toast(t('cp')+': '+p.code)};
new MutationObserver(updatePromoUI).observe($('cart-total'),{childList:true,characterData:true,subtree:true});

/* ======== 5. Контакты ======== */
var cs=document.createElement('section');cs.className='container';cs.id='contacts';cs.style.padding='70px 24px 30px';
cs.innerHTML='<h2 id="sd-ct-t" style="font-family:\'Playfair Display\',serif;font-size:36px;margin:0"></h2><div class="sd-contacts" id="sd-ct"></div>';
document.querySelector('footer.site-footer').insertAdjacentElement('beforebegin',cs);
function renderContacts(){
  var K=C.CONTACT,box=$('sd-ct');$('sd-ct-t').textContent=t('ct');box.innerHTML='';
  [['cph',K.phone,'tel:'+String(K.phone).replace(/[^+\d]/g,'')],['cem',K.email,'mailto:'+K.email],['ctg','@'+K.telegram,'https://t.me/'+K.telegram],['cad',K.address,''],['chr',K.hours,'']].forEach(function(r){
    if(!r[1])return;var d=document.createElement('div');d.className='sd-ct';d.innerHTML='<small></small><div></div>';d.children[0].textContent=t(r[0]);
    var v=d.children[1];if(r[2]){var a=document.createElement('a');a.href=r[2];if(r[2].indexOf('http')===0){a.target='_blank';a.rel='noopener noreferrer'}a.textContent=r[1];v.appendChild(a)}else v.textContent=r[1];box.appendChild(d)});extraContacts()}
function go(id){return function(e){e.preventDefault();e.stopImmediatePropagation();$('mobile-menu').classList.remove('show');var el=$(id);if(el)el.scrollIntoView({behavior:'smooth'})}}
[['nav-event','promos'],['nav-event-m','promos'],['nav-support','contacts'],['nav-support-m','contacts']].forEach(function(p){$(p[0]).addEventListener('click',go(p[1]),true)});
document.querySelector('.contact-btn').addEventListener('click',go('contacts'),true);

/* ======== Дополнения: доставка, оплата, отзывы, галерея, история, франшиза, PWA, доступность ======== */
var X2={
ru:{n_search:'Поиск по меню',n_fav:'Избранное',n_open:'Сейчас открыто',n_closed:'Сейчас закрыто',n_md:'Доставка',n_mp:'Самовывоз',n_fee:'Доставка',n_free:'бесплатно',n_min:'Минимальная сумма для доставки: ',n_cash:'Наличными при получении',n_card:'Картой при получении',n_tr:'Переводом (реквизиты пришлём в Telegram)',n_time:'Время получения',n_asap:'Как можно скорее или укажите время',n_com:'Комментарий к заказу',n_spice:'Острота',n_s0:'Не острое',n_s1:'Средне',n_s2:'Остро',n_hist:'История заказов',n_hist0:'Пока нет заказов',n_rep:'Повторить',n_fr:'Заявка на франшизу',n_frn:'Имя',n_frp:'Телефон',n_frc:'Город',n_frm:'Сообщение',n_frs:'Отправить в Telegram',n_frh:'Откроется Telegram с готовой заявкой. Останется нажать «Отправить».',n_rv:'Отзывы гостей',n_gl:'Интерьер'},
uk:{n_search:'Пошук по меню',n_fav:'Обране',n_open:'Зараз відкрито',n_closed:'Зараз зачинено',n_md:'Доставка',n_mp:'Самовивіз',n_fee:'Доставка',n_free:'безкоштовно',n_min:'Мінімальна сума для доставки: ',n_cash:'Готівкою при отриманні',n_card:'Карткою при отриманні',n_tr:'Переказом (реквізити надішлемо в Telegram)',n_time:'Час отримання',n_asap:'Якнайшвидше або вкажіть час',n_com:'Коментар до замовлення',n_spice:'Гострота',n_s0:'Не гостре',n_s1:'Середньо',n_s2:'Гостро',n_hist:'Історія замовлень',n_hist0:'Замовлень поки немає',n_rep:'Повторити',n_fr:'Заявка на франшизу',n_frn:'Ім’я',n_frp:'Телефон',n_frc:'Місто',n_frm:'Повідомлення',n_frs:'Надіслати в Telegram',n_frh:'Відкриється Telegram із готовою заявкою. Залишиться натиснути «Надіслати».',n_rv:'Відгуки гостей',n_gl:'Інтер’єр'},
en:{n_search:'Search the menu',n_fav:'Favorites',n_open:'Open now',n_closed:'Closed now',n_md:'Delivery',n_mp:'Pickup',n_fee:'Delivery',n_free:'free',n_min:'Minimum order for delivery: ',n_cash:'Cash on receipt',n_card:'Card on receipt',n_tr:'Bank transfer (we will send details in Telegram)',n_time:'Time',n_asap:'As soon as possible, or enter a time',n_com:'Order comment',n_spice:'Spice level',n_s0:'Mild',n_s1:'Medium',n_s2:'Hot',n_hist:'Order history',n_hist0:'No orders yet',n_rep:'Reorder',n_fr:'Franchise inquiry',n_frn:'Name',n_frp:'Phone',n_frc:'City',n_frm:'Message',n_frs:'Send via Telegram',n_frh:'Telegram will open with your inquiry ready. Just press Send.',n_rv:'Guest reviews',n_gl:'Interior'},
ja:{n_search:'メニューを検索',n_fav:'お気に入り',n_open:'営業中',n_closed:'営業時間外',n_md:'配達',n_mp:'店頭受け取り',n_fee:'配達料',n_free:'無料',n_min:'配達の最低注文額：',n_cash:'受け取り時に現金',n_card:'受け取り時にカード',n_tr:'振込（詳細はTelegramでお送りします）',n_time:'受け取り時間',n_asap:'なるべく早く／時間を入力',n_com:'ご要望',n_spice:'辛さ',n_s0:'辛くない',n_s1:'普通',n_s2:'辛口',n_hist:'注文履歴',n_hist0:'まだ注文はありません',n_rep:'再注文',n_fr:'フランチャイズのお問い合わせ',n_frn:'お名前',n_frp:'電話番号',n_frc:'都市',n_frm:'メッセージ',n_frs:'Telegramで送信',n_frh:'Telegramが開きます。送信を押すだけです。',n_rv:'お客様の声',n_gl:'店内の様子'}};
Object.keys(X2).forEach(function(l){for(var k in X2[l])X[l][k]=X2[l][k]});
function refreshN(){
  [].forEach.call(document.querySelectorAll('[data-n]'),function(e){e.textContent=t(e.getAttribute('data-n'))});
  [].forEach.call(document.querySelectorAll('[data-np]'),function(e){e.placeholder=t(e.getAttribute('data-np'))})}
function okImg(u){u=String(u||'');return /^(https?:\/\/|data:image\/)/i.test(u)||/^(?!.*\.\.)[\w\-.\/]+\.(webp|jpe?g|png|avif|gif|svg)$/i.test(u)}
var ai=$('admin-img');if(ai){ai.type='text';ai.placeholder='https://… или images/steak.webp'}

var st2=document.createElement('style');
st2.textContent='.sd-search{flex:1 1 220px;min-width:0;padding:9px 16px;border-radius:22px;border:1px solid rgba(127,154,79,.4);background:var(--surface);color:var(--text);font-family:inherit;font-size:13px}'+
'.sd-heart{position:absolute;top:10px;right:10px;z-index:1;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#555;font-size:18px;cursor:pointer;line-height:1}.sd-heart.on{color:#d13b3b}'+
'.sd-pill{display:inline-block;padding:5px 12px;border-radius:14px;font-size:12px;font-weight:700}.sd-pill.on{background:rgba(79,138,75,.15);color:#4f8a4b}.sd-pill.off{background:rgba(200,85,61,.15);color:#c8553d}'+
'.sd-opts{margin-top:14px}.sd-opt{display:flex;gap:10px;align-items:center;padding:11px 13px;border:1px solid rgba(0,0,0,.12);border-radius:10px;margin-bottom:8px;cursor:pointer;font-size:14px}.sd-opt input{width:auto;margin:0}'+
'.sd-revs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.sd-rev{background:var(--surface);border-radius:14px;padding:20px;box-shadow:var(--shadow)}.sd-st{color:#e0a82e;letter-spacing:2px}.sd-rev p{line-height:1.6;margin:10px 0}'+
'#sd-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}#sd-gal img{width:100%;height:190px;object-fit:cover;border-radius:12px;cursor:pointer}'+
'.sd-map{width:100%;height:320px;border:0;border-radius:14px;margin-top:20px}.sd-ho{padding:12px 0;border-top:1px solid rgba(0,0,0,.08);font-size:13px}.sd-hl{color:var(--muted);margin:4px 0 8px}.sd-ho .ghost-btn{margin-top:0;padding:8px}';
document.head.appendChild(st2);

/* --- доставка / самовывоз --- */
var D=C.DELIVERY,OPT={mode:'delivery',pay:'cash'};
function feeOf(c){return OPT.mode==='delivery'&&c.sum>0&&(c.sum-c.disc)<D.freeFrom?D.fee:0}
function radios(name,vals,cur,onch){
  var w=document.createElement('div');w.className='sd-opts';
  vals.forEach(function(v){var l=document.createElement('label');l.className='sd-opt';l.innerHTML='<input type="radio" name="'+name+'" value="'+v[0]+'"><span data-n="'+v[1]+'"></span>';
    var r=l.firstChild;r.checked=r.defaultChecked=(v[0]===cur);r.onchange=function(){onch(v[0])};w.appendChild(l)});return w}
var ad=$('co-address'),adf=ad.closest('.field'),PK='Самовывоз / Pickup';
function syncAddr(){var p=OPT.mode==='pickup';adf.style.display=p?'none':'';ad.required=!p;if(!p&&ad.value===PK)ad.value=''}
function renderCo(){
  var s=$('co-summary'),o=s.querySelector('.sd-co');if(o)o.remove();
  var c=calc(),fe=feeOf(c),d=document.createElement('div');d.className='sd-co';
  if(c.p)d.appendChild(line(t('pd')+' '+c.p.code,'−'+f(c.disc)));
  if(OPT.mode==='delivery')d.appendChild(line(t('n_fee'),fe?f(fe):t('n_free')));
  d.appendChild(line(t('pf'),f(c.sum-c.disc+fe),true));s.appendChild(d)}
new MutationObserver(function(){if(!$('co-summary').querySelector('.sd-co'))renderCo()}).observe($('co-summary'),{childList:true});
$('co-next-0').parentNode.insertBefore(radios('sd-mode',[['delivery','n_md'],['pickup','n_mp']],'delivery',function(v){OPT.mode=v;syncAddr();renderCo()}),$('co-next-0'));
$('co-next-0').addEventListener('click',function(e){var c=calc();if(OPT.mode==='delivery'&&c.sum-c.disc<D.min){e.stopImmediatePropagation();toast(t('n_min')+f(D.min))}},true);
$('form-checkout-details').querySelector('button[type=submit]').insertAdjacentHTML('beforebegin','<div class="field"><label data-n="n_time"></label><input id="sd-time" type="text" maxlength="40" data-np="n_asap"></div><div class="field"><label data-n="n_com"></label><input id="sd-com" type="text" maxlength="200"></div>');
$('form-checkout-details').addEventListener('submit',function(){if(OPT.mode==='pickup')ad.value=PK},true);

/* --- оплата: без ввода карты --- */
['co-card','co-expiry','co-cvc'].forEach(function(id){$(id).required=false});
$('co-card').closest('.field').style.display='none';$('co-expiry').closest('.field-row').style.display='none';
$('checkout-error').parentNode.insertBefore(radios('sd-pay',[['cash','n_cash'],['card','n_card'],['transfer','n_tr']],'cash',function(v){OPT.pay=v}),$('checkout-error'));

/* --- заказ в Telegram --- */
var snap=null,sent='',PAYRU={cash:'Наличными при получении',card:'Картой при получении',transfer:'Переводом'},tg=document.createElement('a');
tg.className='primary-btn';tg.target='_blank';tg.rel='noopener noreferrer';tg.style.cssText='display:none;text-align:center;text-decoration:none;margin-bottom:10px';
$('co-finish').insertAdjacentElement('beforebegin',tg);
$('form-checkout-payment').addEventListener('submit',function(){
  $('co-card').value='0000 0000 0000 0000';$('co-expiry').value='12/99';$('co-cvc').value='000'; /* заглушки для проверки исходного скрипта, карта не собирается */
  var c=calc();snap={items:c.list,sum:c.sum,disc:c.disc,fee:feeOf(c),promo:c.p?c.p.code:null,mode:OPT.mode,pay:OPT.pay,
    time:$('sd-time').value.trim(),com:$('sd-com').value.trim(),name:$('co-name').value.trim(),phone:$('co-phone').value.trim(),address:ad.value.trim(),notes:rd('sd_notes',{})}},true);
new MutationObserver(function(){
  var m=($('order-number').textContent||'').match(/SD-\d+/);
  if(!m||!snap||m[0]===sent)return;sent=m[0];var s=snap;
  var lines=s.items.map(function(i){var n=s.notes[i.id];return '• '+i.name+' × '+i.qty+(n?' ('+n+')':'')}).join('\n');
  var txt='🆕 Заказ '+m[0]+'\n'+lines+'\n\nИтого: '+(s.sum-s.disc+s.fee)+' ₩'+(s.promo?' (промокод '+s.promo+', −'+s.disc+' ₩)':'')+
    (s.mode==='delivery'?'\nДоставка: '+(s.fee?s.fee+' ₩':'бесплатно'):'\nСамовывоз')+'\nОплата: '+PAYRU[s.pay]+(s.time?'\nВремя: '+s.time:'')+(s.com?'\nКомментарий: '+s.com:'')+
    '\n\n'+s.name+', '+s.phone+(s.mode==='delivery'?'\n'+s.address:'');
  tg.href='https://t.me/'+C.CONTACT.telegram+'?text='+encodeURIComponent(txt);tg.textContent='✈️ '+t('tgs');tg.style.display='block';
  snap=null;wr('sd_promo','');wr('sd_notes',{});$('sd-pin').value='';updatePromoUI()
}).observe($('order-number'),{childList:true,characterData:true,subtree:true});

/* --- история заказов в аккаунте --- */
var hist=document.createElement('div');hist.id='sd-hist';$('modal-auth').appendChild(hist);
function renderHist(){
  var em=_get.call(LS,'sd_current_user'),list=rd('sd_orders_'+(em||'guest'),[]).slice(-10).reverse(),items=cleanList(rd('sd_food_items',[]));
  function nm(id){var it=items.filter(function(i){return i.id===id})[0];return it?(it.customName||NM[id]||id):null}
  hist.innerHTML='<h3 style="font-family:\'Playfair Display\',serif;margin:22px 0 8px"></h3>';hist.firstChild.textContent=t('n_hist');
  if(!list.length){var e=document.createElement('div');e.className='sub';e.textContent=t('n_hist0');hist.appendChild(e);return}
  list.forEach(function(o){var d=document.createElement('div');d.className='sd-ho';d.innerHTML='<b></b><div class="sd-hl"></div>';
    d.children[0].textContent=o.number+' · '+new Date(o.date).toLocaleDateString()+' · '+f(o.total);
    d.children[1].textContent=o.items.map(function(i){return (nm(i.id)||i.id)+' × '+i.qty}).join(', ');
    var b=document.createElement('button');b.type='button';b.className='ghost-btn';b.textContent=t('n_rep');
    b.onclick=function(){var cart=rd('sd_cart',{});o.items.forEach(function(i){if(nm(i.id))cart[i.id]=(cart[i.id]||0)+i.qty});wr('sd_cart',cart);sessionStorage.setItem('sd_opencart','1');location.reload()};
    d.appendChild(b);hist.appendChild(d)})}
$('btn-account').addEventListener('click',renderHist);
['form-login','form-register'].forEach(function(id){$(id).addEventListener('submit',function(){setTimeout(renderHist,150)})});
$('btn-logout').addEventListener('click',function(){setTimeout(renderHist,150)});

/* --- «Сейчас открыто» и карта --- */
function isOpen(){var H=C.HOURS;try{
  var p=new Intl.DateTimeFormat('en-GB',{timeZone:H.tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).split(':'),
  n=+p[0]*60+ +p[1],a=H.open.split(':'),b=H.close.split(':'),o=+a[0]*60+ +a[1],c=+b[0]*60+ +b[1];
  return c>o?(n>=o&&n<c):(n>=o||n<c)}catch(e){return null}}
function pill(){var o=isOpen(),s=document.createElement('span');if(o===null)return s;s.className='sd-pill '+(o?'on':'off');s.textContent='● '+t(o?'n_open':'n_closed')+' · '+C.HOURS.open+'–'+C.HOURS.close;return s}
function renderOpen(){var h=$('sd-open');if(!h){h=document.createElement('div');h.id='sd-open';h.style.margin='14px 0 0';document.querySelector('.hero-sub').insertAdjacentElement('afterend',h)}h.innerHTML='';h.appendChild(pill())}
function extraContacts(){
  [].forEach.call($('sd-ct').children,function(c){if(c.children[0].textContent===t('chr')){c.children[1].appendChild(document.createElement('br'));c.children[1].appendChild(pill())}});
  if(C.MAP!==false&&C.CONTACT.address&&!$('sd-map')){var m=document.createElement('iframe');m.id='sd-map';m.className='sd-map';m.loading='lazy';m.title='Map';
    m.src='https://www.google.com/maps?q='+encodeURIComponent(C.CONTACT.address)+'&output=embed';cs.appendChild(m)}}

/* --- отзывы и галерея (наполняет владелец в админке) --- */
var EX=rd('sd_extra',{});EX.reviews=EX.reviews||[];EX.gallery=EX.gallery||[];
var gs=document.createElement('section'),rs=document.createElement('section');
gs.className=rs.className='container';gs.id='interior';rs.id='reviews';gs.style.padding=rs.style.padding='60px 24px 0';
var hh='font-family:\'Playfair Display\',serif;font-size:36px;margin:0 0 20px';
gs.innerHTML='<h2 style="'+hh+'" data-n="n_gl"></h2><div id="sd-gal"></div>';
rs.innerHTML='<h2 style="'+hh+'" data-n="n_rv"></h2><div class="sd-revs" id="sd-revs"></div>';
cs.insertAdjacentElement('beforebegin',gs);cs.insertAdjacentElement('beforebegin',rs);
function renderExtra(){
  var rv=$('sd-revs'),g=$('sd-gal');rv.innerHTML='';g.innerHTML='';rs.style.display=EX.reviews.length?'':'none';gs.style.display=EX.gallery.length?'':'none';
  EX.reviews.forEach(function(r){var d=document.createElement('div'),n=Math.max(1,Math.min(5,+r.r||5));d.className='sd-rev';d.innerHTML='<div class="sd-st"></div><p></p><b></b>';
    d.children[0].textContent='★'.repeat(n)+'☆'.repeat(5-n);d.children[1].textContent=r.t;d.children[2].textContent=r.n;rv.appendChild(d)});
  EX.gallery.forEach(function(u){if(!okImg(u))return;var i=document.createElement('img');i.src=u;i.alt='';i.loading='lazy';
    i.onclick=function(){var b=document.createElement('img');b.src=u;b.alt='';b.style.cssText='width:100%;border-radius:12px;margin-top:20px';openM(b)};g.appendChild(i)})}
var ac=document.createElement('div');ac.className='admin-card';ac.style.marginTop='22px';
ac.innerHTML='<h3>Отзывы и интерьер</h3><div class="admin-note" style="margin:0 0 12px">Добавляйте только настоящие отзывы гостей. После правок скачайте menu.json.</div><div class="field"><label>Имя гостя</label><input id="sd-rn" type="text"></div><div class="field"><label>Текст отзыва</label><input id="sd-rt" type="text"></div><div class="field"><label>Оценка</label><select id="sd-rr"><option>5</option><option>4</option><option>3</option></select></div><button class="primary-btn" id="sd-radd" type="button">＋ Добавить отзыв</button><div class="admin-list" id="sd-rl" style="margin:12px 0 22px"></div><div class="field"><label>Фото интерьера (ссылка или images/hall.webp)</label><input id="sd-gu" type="text"></div><button class="primary-btn" id="sd-gadd" type="button">＋ Добавить фото</button><div class="admin-list" id="sd-gl" style="margin-top:12px"></div>';
$('admin-content').appendChild(ac);
function delRow(text,fn){var r=document.createElement('div');r.className='admin-food';r.style.gridTemplateColumns='1fr auto';r.innerHTML='<div class="meta"></div><button class="admin-delete" type="button">Удалить</button>';r.children[0].textContent=text;r.children[1].onclick=fn;return r}
function renderAdminEx(){
  var a=$('sd-rl'),b=$('sd-gl');a.innerHTML='';b.innerHTML='';
  EX.reviews.forEach(function(r,i){a.appendChild(delRow(r.n+': '+r.t,function(){EX.reviews.splice(i,1);saveEx()}))});
  EX.gallery.forEach(function(u,i){b.appendChild(delRow(u,function(){EX.gallery.splice(i,1);saveEx()}))})}
function saveEx(){wr('sd_extra',EX);wr('sd_dirty',1);renderExtra();renderAdminEx()}
$('sd-radd').onclick=function(){var n=$('sd-rn').value.trim(),tx=$('sd-rt').value.trim();if(!n||!tx)return;EX.reviews.push({n:n,t:tx,r:+$('sd-rr').value});$('sd-rn').value=$('sd-rt').value='';saveEx()};
$('sd-gadd').onclick=function(){var u=$('sd-gu').value.trim();if(!okImg(u)){toast('Нужна ссылка https://… или путь вида images/hall.webp');return}EX.gallery.push(u);$('sd-gu').value='';saveEx()};

/* --- форма заявки на франшизу --- */
$('franchise-cta').addEventListener('click',function(e){
  e.preventDefault();e.stopImmediatePropagation();
  var fm=document.createElement('form');
  fm.innerHTML='<h2></h2><div class="sub"></div><div class="field"><label data-n="n_frn"></label><input name="n" required></div><div class="field"><label data-n="n_frp"></label><input name="p" type="tel" required></div><div class="field"><label data-n="n_frc"></label><input name="c" required></div><div class="field"><label data-n="n_frm"></label><input name="m"></div><button class="primary-btn" type="submit" data-n="n_frs"></button>';
  fm.children[0].textContent=t('n_fr');fm.children[1].textContent=t('n_frh');
  fm.onsubmit=function(ev){ev.preventDefault();var g=function(k){return fm.elements[k].value.trim()};
    var txt='🏢 Заявка на франшизу\n'+g('n')+', '+g('p')+'\nГород: '+g('c')+(g('m')?'\n'+g('m'):'');
    window.open('https://t.me/'+C.CONTACT.telegram+'?text='+encodeURIComponent(txt),'_blank','noopener');closeM()};
  openM(fm);refreshN()},true);

/* --- доступность: фокус внутри окон, объявления для экранных читалок --- */
$('toast-stack').setAttribute('role','status');$('toast-stack').setAttribute('aria-live','polite');
var panels=[].slice.call(document.querySelectorAll('.modal,.drawer,.lightbox,.mobile-menu,.admin-panel')),lastFocus=null,FQ='input,button,select,textarea,a[href]';
panels.forEach(function(p){if(!p.classList.contains('mobile-menu')&&!p.classList.contains('admin-panel'))p.setAttribute('aria-modal','true');
  new MutationObserver(function(){
    var open=p.classList.contains('show')||p.classList.contains('open');
    if(open&&!p._o){p._o=1;lastFocus=document.activeElement;setTimeout(function(){var el=p.querySelector(FQ);if(el)el.focus()},60)}
    if(!open&&p._o){p._o=0;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
  }).observe(p,{attributes:true,attributeFilter:['class']})});
document.addEventListener('keydown',function(e){
  if(e.key!=='Tab')return;
  var v=panels.filter(function(p){return p.classList.contains('show')||p.classList.contains('open')}),p=v[v.length-1];if(!p)return;
  var els=[].filter.call(p.querySelectorAll(FQ),function(x){return !x.disabled&&x.offsetParent!==null});if(!els.length)return;
  var a=els[0],z=els[els.length-1];
  if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}});

/* ======== Старт ======== */
function refreshAll(){renderPromos();renderContacts();updatePromoUI();refreshN();renderBar();renderExtra();renderOpen();if($('co-summary').children.length)renderCo()}
new MutationObserver(refreshAll).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
syncAddr();refreshAll();renderAdminEx();renderHist();pull();setInterval(renderOpen,60000);
if(sessionStorage.getItem('sd_opencart')){sessionStorage.removeItem('sd_opencart');setTimeout(function(){$('btn-cart').click()},400)}
if(/^https?:$/.test(location.protocol)){
  if(!document.querySelector('link[rel=manifest]')){var mf=document.createElement('link');mf.rel='manifest';mf.href='manifest.webmanifest';document.head.appendChild(mf)}
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){})}
})();
