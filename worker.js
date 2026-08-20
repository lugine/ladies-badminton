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
@media(max-width:430px){#profiles{grid-template-columns:1fr 1fr!important}}
#attDate,#saveAttendance,#attGrid{display:none!important}
</style>
<script>
(function(){
'use strict';
const U='https://zcahhfswtdrdmguppqtp.supabase.co',K='sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs',A='a517d9bd-bc9c-4e59-b36d-503747621aa4';
function install(){
 const box=document.getElementById('modalBox'); if(!box)return;
 const pin=document.getElementById('pin'),save=document.getElementById('saveProfile');
 if(pin&&save&&!box.dataset.pinFixed){
  const labels=[...box.querySelectorAll('label')]; const lab=labels.find(x=>/PIN/i.test(x.textContent||'')); if(lab)lab.remove(); pin.remove();
  box.dataset.pinFixed='1';
  save.onclick=async()=>{
   const db=window.supabase.createClient(U,K); const s=await db.auth.getSession();
   if(!s.data?.session||s.data.session.user?.id!==A)return alert('Only the admin can change profile information.');
   const nick=document.getElementById('editNick')?.value.trim()||'',file=document.getElementById('photo')?.files?.[0];
   const ps=await db.from('players').select('*').order('created_at',{ascending:true}); if(ps.error)return alert(ps.error.message);
   const text=box.textContent||''; const p=(ps.data||[]).find(x=>text.includes(x.nickname||x.name)); if(!p)return alert('Could not identify this player.');
   save.disabled=true;save.textContent='Saving…';let url=p.avatar_url||'';
   if(file){if(!file.type.startsWith('image/')){save.disabled=false;save.textContent='Save';return alert('Please choose an image.')}if(file.size>5*1024*1024){save.disabled=false;save.textContent='Save';return alert('Photo must be under 5 MB.')}const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':file.type==='image/gif'?'gif':'jpg';const path=p.id+'/'+Date.now()+'.'+ext;const up=await db.storage.from('profile-avatars').upload(path,file,{upsert:true,contentType:file.type});if(up.error){save.disabled=false;save.textContent='Save';return alert('Could not upload photo: '+up.error.message)}url=U+'/storage/v1/object/public/profile-avatars/'+path}
   const q=await db.from('players').update({nickname:nick||p.name,avatar_url:url}).eq('id',p.id);if(q.error){save.disabled=false;save.textContent='Save';return alert('Could not save profile: '+q.error.message)}location.reload();
  };
 }
 const admin=document.getElementById('adminPanel');
 if(admin){['attDate','saveAttendance','attGrid'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove()});}
}
function watch(){install();const m=document.getElementById('modal');if(m&&!m.dataset.pinWatcher){m.dataset.pinWatcher='1';new MutationObserver(install).observe(m,{childList:true,subtree:true)}}}
let n=0;const t=setInterval(()=>{watch();if(++n>80)clearInterval(t)},250);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
</script>`;
    const body=html.includes('</body>')?html.replace('</body>',injection+'</body>'):html+injection;
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }
};
