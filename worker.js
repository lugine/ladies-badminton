export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("text/html")) return response;

    return new HTMLRewriter()
      .on("body", {
        element(element) {
          element.append(`<script>
(function(){
  function cleanPublicError(){
    try {
      document.querySelectorAll('div').forEach(function(el){
        var text=(el.textContent||'').trim().toLowerCase();
        if(text === 'could not load the database' || text === "database couldn't be loaded" || text.indexOf("couldn't load the database") !== -1){
          el.remove();
        }
      });
    } catch(e) {}
  }

  function setDateAndSchedule(){
    try {
      var now=new Date();
      var date=document.getElementById('date');
      if(date) date.textContent=now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
      var blackouts={'2026-08-27':true},target=null,active=false;
      for(var i=0;i<30;i++){
        var d=new Date(now); d.setDate(d.getDate()+i);
        if(d.getDay()!==4) continue;
        var key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        if(blackouts[key]) continue;
        var start=new Date(d); start.setHours(18,0,0,0);
        var end=new Date(d); end.setHours(20,0,0,0);
        if(now<end){target={start:start,end:end};active=now>=start;break;}
      }
      if(!target) return;
      var title=document.getElementById('nextTitle');
      var meta=document.getElementById('nextMeta');
      var countdown=document.getElementById('countdown');
      if(title) title.textContent=active?'Game happening now':(target.start.toDateString()===now.toDateString()?'Today':target.start.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}))+' · 6–8 PM';
      if(meta) meta.textContent=active?'Ends at 8:00 PM':'Thursday session';
      if(countdown){var sec=Math.max(0,Math.floor(((active?target.end:target.start)-now)/1000));var days=Math.floor(sec/86400);sec%=86400;var h=Math.floor(sec/3600);sec%=3600;var m=Math.floor(sec/60),s=sec%60;countdown.textContent=active?'Ends in '+h+'h '+m+'m '+s+'s':'Starts in '+(days?days+'d ':'')+h+'h '+m+'m '+s+'s';}
    } catch(e) {}
  }

  function setupDuplicateCheck(){
    try {
      var button=document.getElementById('addPlayer');
      if(!button || !window.supabase) return;
      button.addEventListener('click', async function(event){
        var first=document.getElementById('firstName');
        var nick=document.getElementById('nickname');
        if(!first) return;
        var name=(nick && nick.value.trim()) || first.value.trim();
        if(!name) return;
        var client=window.supabase.createClient('https://zcahhfswtdrdmguppqtp.supabase.co','sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs');
        var result=await client.from('players').select('id,name,nickname').ilike('name', first.value.trim()).limit(1);
        var result2=await client.from('players').select('id,name,nickname').or('name.ilike.'+encodeURIComponent(name)+',nickname.ilike.'+encodeURIComponent(name)).limit(1);
        var found=(result.data&&result.data[0]) || (result2.data&&result2.data[0]);
        if(found){
          event.preventDefault();
          event.stopImmediatePropagation();
          var t=document.createElement('div');
          t.textContent='That name is already taken. Please choose another name or contact the admin.';
          t.style.cssText='position:fixed;z-index:100;bottom:18px;left:50%;transform:translateX(-50%);background:#D4A537;color:#211F1B;font-weight:800;padding:10px 16px;border-radius:20px;max-width:90%;text-align:center';
          document.body.appendChild(t);
          setTimeout(function(){t.remove()},3200);
        }
      }, true);
    } catch(e) {}
  }

  cleanPublicError();
  setDateAndSchedule();
  setupDuplicateCheck();
  setInterval(cleanPublicError,250);
  setInterval(setDateAndSchedule,1000);

  function showRecovery(){
    if (document.getElementById('passwordRecoveryModal')) return;
    var overlay=document.createElement('div');
    overlay.id='passwordRecoveryModal';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;';
    overlay.innerHTML='<div style="width:100%;max-width:380px;background:#163A30;border:1px solid rgba(250,246,237,.14);border-radius:14px;padding:22px;color:#FAF6ED;box-sizing:border-box;"><h2 style="margin:0 0 8px;font-family:Georgia,serif;">Set a new password</h2><p style="font-size:13px;line-height:1.5;color:rgba(250,246,237,.68);margin:0 0 15px;">Enter your new password below.</p><input id="recoveryPassword" type="password" autocomplete="new-password" placeholder="New password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:9px;"><input id="recoveryPassword2" type="password" autocomplete="new-password" placeholder="Confirm password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:9px;"><div id="recoveryMessage" style="font-size:12px;color:rgba(250,246,237,.58);min-height:18px;margin-bottom:9px;"></div><button id="recoverySave" style="width:100%;border:0;border-radius:8px;padding:11px 15px;background:#D4A537;color:#211F1B;font-weight:700;font-size:14px;cursor:pointer;">Save new password</button></div>';
    document.body.appendChild(overlay);
    document.getElementById('recoverySave').onclick=async function(){
      var p1=document.getElementById('recoveryPassword').value,p2=document.getElementById('recoveryPassword2').value,msg=document.getElementById('recoveryMessage');
      if(!p1||p1.length<6){msg.textContent='Use at least 6 characters.';return;}
      if(p1!==p2){msg.textContent='The passwords do not match.';return;}
      this.disabled=true;msg.textContent='Saving…';
      try{var client=window.supabase.createClient('https://zcahhfswtdrdmguppqtp.supabase.co','sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs');var result=await client.auth.updateUser({password:p1});if(result.error)throw result.error;msg.textContent='Password updated ✓';setTimeout(function(){window.history.replaceState({},document.title,window.location.pathname);overlay.remove();},900);}catch(e){this.disabled=false;msg.textContent=e.message||'Could not update the password.';}
    };
  }

  function startRecovery(){
    try {
      var hash=new URLSearchParams(window.location.hash.replace(/^#/,''));
      if(hash.get('type')==='recovery') setTimeout(showRecovery,150);
      var client=window.supabase.createClient('https://zcahhfswtdrdmguppqtp.supabase.co','sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs');
      client.auth.onAuthStateChange(function(event){if(event==='PASSWORD_RECOVERY') showRecovery();});
    } catch(e) {}
  }
  startRecovery();
})();
</script>`, { html: true });
        }
      })
      .transform(response);
  }
};
