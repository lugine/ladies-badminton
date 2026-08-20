export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    const html = await response.text();
    const injection = `
<style>
#roster,#rosterEmpty{display:none!important}
#profiles{grid-template-columns:1fr 1fr!important}
#attDate,#saveAttendance,#attGrid{display:none!important}
</style>
<script>
(function(){
'use strict';
function restoreAdminUI(){
 const admin=document.getElementById('adminPanel');
 if(!admin || document.getElementById('restoredAdminTools')) return;
 const box=document.createElement('div');
 box.id='restoredAdminTools';
 box.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
 box.innerHTML='<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#E8C978;margin-bottom:9px">Admin Tools</div>'+
   '<div class="row"><button id="showProfilesAdmin" type="button" class="btn gold">Add / Change Profile Photo</button><button id="showDeleteGameAdmin" type="button" class="btn danger">Delete Accidental Game</button><button id="showDeleteProfileAdmin" type="button" class="btn danger">Delete Profile</button></div>'+
   '<div id="adminToolStatus" class="muted" style="margin-top:8px"></div>';
 admin.appendChild(box);
 document.getElementById('showProfilesAdmin').onclick=()=>{
   const profiles=document.getElementById('profiles');
   if(profiles){profiles.scrollIntoView({behavior:'smooth'});document.getElementById('adminToolStatus').textContent='Tap the player profile you want to edit, then choose their photo.'}
 };
 document.getElementById('showDeleteGameAdmin').onclick=()=>{
   const panel=document.getElementById('managePanel');
   if(panel){panel.classList.remove('hidden');panel.scrollIntoView({behavior:'smooth'});document.getElementById('adminToolStatus').textContent='Game management is now open below. Select the accidental game and delete it.'}
 };
 document.getElementById('showDeleteProfileAdmin').onclick=()=>{
   const profiles=document.getElementById('profiles');
   if(profiles){profiles.scrollIntoView({behavior:'smooth'});document.getElementById('adminToolStatus').textContent='Open the player profile you want to remove. Admin profile management is available there.'}
 };
}
function cleanProfileModal(){
 const box=document.getElementById('modalBox');if(!box)return;
 const pin=document.getElementById('pin');if(pin){const p=pin.closest('div');if(p)p.remove();else pin.remove()}
 [...box.querySelectorAll('label')].filter(x=>/pin/i.test(x.textContent||'')).forEach(x=>x.remove());
}
function run(){cleanProfileModal();restoreAdminUI();const manage=document.getElementById('managePanel');const admin=document.getElementById('adminPanel');if(admin&&!admin.classList.contains('hidden')&&manage)manage.classList.remove('hidden')}
let n=0;const timer=setInterval(()=>{run();if(++n>160)clearInterval(timer)},250);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
</script>`;
    const body=html.includes('</body>')?html.replace('</body>',injection+'</body>'):html+injection;
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }
};
