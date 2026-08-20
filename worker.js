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
  'use strict';
  var SUPABASE_URL='https://zcahhfswtdrdmguppqtp.supabase.co';
  var SUPABASE_KEY='sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs';
  var ADMIN_ID='a517d9bd-bc9c-4e59-b36d-503747621aa4';
  var db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  function esc(v){var d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML;}
  function toast(msg){var old=document.getElementById('__profile_toast');if(old)old.remove();var t=document.createElement('div');t.id='__profile_toast';t.textContent=msg;t.style.cssText='position:fixed;z-index:100000;bottom:20px;left:50%;transform:translateX(-50%);background:#D4A537;color:#211F1B;font-weight:800;padding:10px 16px;border-radius:20px;max-width:90%;text-align:center';document.body.appendChild(t);setTimeout(function(){t.remove();},2500);}
  function cleanOldDatabaseError(){try{document.querySelectorAll('div').forEach(function(el){var text=(el.textContent||'').trim();if(text==='Could not load the database'||text==="Database couldn't be loaded")el.remove();});}catch(e){}}
  function formatDateText(text){
    if(!text)return text;
    var m=text.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
    if(!m)return text;
    var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    return d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
  }
  function playerName(p){return (p.nickname||p.name||'Player').trim();}
  function avatarHtml(p,size){
    var s=size||56;
    if(p.avatar_url)return '<img src="'+esc(p.avatar_url)+'" alt="Profile photo" style="width:'+s+'px;height:'+s+'px;border-radius:50%;object-fit:cover;display:block">';
    return '<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;background:rgba(250,246,237,.12);border:1px solid rgba(250,246,237,.18);display:flex;align-items:center;justify-content:center;color:rgba(250,246,237,.35);font-size:22px">○</div>';
  }
  function styles(){
    if(document.getElementById('__profile_styles'))return;
    var s=document.createElement('style');s.id='__profile_styles';s.textContent='.profile-edit-wrap{margin:10px 0 4px}.profile-editor-note{font-size:12px;line-height:1.45;color:rgba(250,246,237,.62);margin:8px 0 14px}.profile-photo-preview{width:78px;height:78px;border-radius:50%;object-fit:cover;background:rgba(250,246,237,.08);border:1px solid rgba(250,246,237,.16);display:block;margin:8px 0}.profile-avatar-added{display:inline-flex;vertical-align:middle;margin-right:8px}.join-date-readable{display:inline}';document.head.appendChild(s);
  }
  function findCurrentPlayer(){
    var box=document.getElementById('modalBox');
    if(!box)return null;
    var text=box.textContent||'';
    var fm=text.match(/Full name:\s*([^\n]+?)(?:Nickname:|Date joined:|Attendance:|Wins:)/i);
    var nm=text.match(/Nickname:\s*([^\n]+?)(?:Date joined:|Attendance:|Wins:)/i);
    var full=(fm&&fm[1]||'').trim();
    var nick=(nm&&nm[1]||'').trim();
    if(!full&&!nick)return null;
    return db.from('players').select('id,name,full_name,nickname,date_joined,avatar_url,profile_pin').or('name.eq.'+encodeURIComponent(full)+',nickname.eq.'+encodeURIComponent(nick)).limit(1).then(function(q){return q.data&&q.data[0]||null;});
  }
  function formatJoinDateInModal(){
    var box=document.getElementById('modalBox');if(!box)return;
    var walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
    var nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(function(n){
      var t=n.nodeValue||'';
      var m=t.match(/(Date joined:\s*)(\\d{4}-\\d{2}-\\d{2})/);
      if(m)n.nodeValue=t.replace(m[0],m[1]+formatDateText(m[2]));
    });
  }
  async function addEditButton(){
    try{
      var box=document.getElementById('modalBox');if(!box)return;
      var text=box.textContent||'';
      if(text.indexOf('Full name:')===-1)return;
      formatJoinDateInModal();
      if(box.querySelector('[data-player-edit]'))return;
      var p=await findCurrentPlayer();if(!p)return;
      var row=box.querySelector('.row');
      var b=document.createElement('button');b.type='button';b.dataset.playerEdit='1';b.className='btn gold profile-edit-wrap';b.textContent='Edit my profile';
      if(row)row.parentNode.insertBefore(b,row);else box.appendChild(b);
      b.onclick=function(){openEditor(p);};
    }catch(e){}
  }
  function ensureProfilePictures(){
    try{
      db.from('players').select('id,name,nickname,avatar_url').eq('active',true).then(function(q){
        var ps=q.data||[];
        document.querySelectorAll('.profile').forEach(function(card){
          if(card.querySelector('[data-profile-avatar]'))return;
          var b=card.querySelector('b');var name=(b&&b.textContent||'').trim();var p=ps.find(function(x){return playerName(x)===name||x.name===name||x.nickname===name});if(!p)return;
          var a=document.createElement('span');a.dataset.profileAvatar='1';a.innerHTML=avatarHtml(p,48);a.style.cssText='display:block;margin-bottom:6px';card.prepend(a);
        });
        document.querySelectorAll('.lb').forEach(function(row){
          if(row.querySelector('[data-score-avatar]'))return;
          var n=row.querySelector('.name');if(!n)return;
          var text='';for(var i=0;i<n.childNodes.length;i++){if(n.childNodes[i].nodeType===3){text=n.childNodes[i].textContent.trim();if(text)break;}}
          var p=ps.find(function(x){return playerName(x)===text||x.name===text||x.nickname===text});if(!p)return;
          var a=document.createElement('span');a.dataset.scoreAvatar='1';a.className='profile-avatar-added';a.innerHTML=avatarHtml(p,34);n.prepend(a);
        });
      });
    }catch(e){}
  }
  function openEditor(p){
    var old=document.getElementById('__edit_profile');if(old)old.remove();
    var o=document.createElement('div');o.id='__edit_profile';o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif';
    o.innerHTML='<div style="width:100%;max-width:390px;background:#163A30;border:1px solid rgba(250,246,237,.14);border-radius:14px;padding:20px;color:#FAF6ED;box-sizing:border-box"><h2 style="margin:0;font-family:Georgia,serif">Edit profile</h2><div class="profile-editor-note">You can change your nickname and profile photo. Your real name, date joined, scores and attendance cannot be changed.</div><label style="font-size:12px;display:block;margin-bottom:6px">Profile PIN</label><input id="epin" type="password" inputmode="numeric" maxlength="6" placeholder="6-digit PIN" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:10px"><label style="font-size:12px;display:block;margin-bottom:6px">Nickname</label><input id="enick" maxlength="30" placeholder="Nickname" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:10px"><label style="font-size:12px;display:block;margin-bottom:6px">Profile picture</label><input id="ephoto" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:10px;color:#FAF6ED;font-size:13px"><img id="epreview" class="profile-photo-preview" src="'+esc(p.avatar_url||'')+'"><div class="row" style="margin-top:12px"><button id="ecancel" type="button" class="btn ghost">Cancel</button><button id="esave" type="button" class="btn gold">Save</button></div></div>';
    document.body.appendChild(o);
    var nick=o.querySelector('#enick');nick.value=p.nickname||'';
    o.querySelector('#ephoto').onchange=function(){var f=this.files&&this.files[0];if(f){if(f.size>5*1024*1024){toast('Photo must be under 5 MB');this.value='';return;}o.querySelector('#epreview').src=URL.createObjectURL(f);}};
    o.querySelector('#ecancel').onclick=function(){o.remove();};
    o.querySelector('#esave').onclick=async function(){
      var pin=o.querySelector('#epin').value.trim(),nickname=o.querySelector('#enick').value.trim(),file=o.querySelector('#ephoto').files&&o.querySelector('#ephoto').files[0],avatar=p.avatar_url||'';
      if(!/^\\d{6}$/.test(pin)){toast('Enter your 6-digit profile PIN');return;}
      if(file){var ext=(file.type.split('/')[1]||'jpg').toLowerCase();if(ext==='jpeg')ext='jpg';var path=p.id+'/'+Date.now()+'.'+ext;var up=await db.storage.from('profile-avatars').upload(path,file,{upsert:true,contentType:file.type||'image/jpeg'});if(up.error){toast('Could not upload photo');return;}avatar=SUPABASE_URL+'/storage/v1/object/public/profile-avatars/'+path;}
      var q=await db.rpc('update_player_profile',{p_player_id:p.id,p_pin:pin,p_nickname:nickname,p_avatar_url:avatar});
      if(q.error){toast('Could not save profile');return;}
      if(q.data!==true){toast('Wrong profile PIN');return;}
      o.remove();toast('Profile updated ✓');setTimeout(function(){location.reload();},300);
    };
  }
  function showRecovery(){
    if(document.getElementById('__recovery'))return;
    var o=document.createElement('div');o.id='__recovery';o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif';
    o.innerHTML='<div style="width:100%;max-width:380px;background:#163A30;border:1px solid rgba(250,246,237,.14);border-radius:14px;padding:22px;color:#FAF6ED"><h2 style="margin:0 0 8px;font-family:Georgia,serif">Set a new password</h2><input id="rp1" type="password" placeholder="New password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px;color:#FAF6ED;margin-bottom:8px"><input id="rp2" type="password" placeholder="Confirm password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px;color:#FAF6ED;margin-bottom:8px"><div id="rmsg" style="font-size:12px;min-height:18px;color:rgba(250,246,237,.6)"></div><button id="rsave" class="btn gold" style="width:100%;margin-top:8px">Save new password</button></div>';
    document.body.appendChild(o);
    o.querySelector('#rsave').onclick=async function(){var a=o.querySelector('#rp1').value,b=o.querySelector('#rp2').value,msg=o.querySelector('#rmsg');if(a.length<6){msg.textContent='Use at least 6 characters.';return;}if(a!==b){msg.textContent='Passwords do not match.';return;}var q=await db.auth.updateUser({password:a});if(q.error){msg.textContent=q.error.message;return;}msg.textContent='Password updated ✓';setTimeout(function(){o.remove();history.replaceState({},document.title,location.pathname);},800);};
  }
  function watch(){
    styles();
    cleanOldDatabaseError();
    ensureProfilePictures();
    addEditButton();
    var mb=document.getElementById('modalBox');
    if(mb){new MutationObserver(function(){setTimeout(function(){formatJoinDateInModal();addEditButton();},30);}).observe(mb,{childList:true,subtree:true,characterData:true});}
    var root=document.body;new MutationObserver(function(){cleanOldDatabaseError();ensureProfilePictures();addEditButton();}).observe(root,{childList:true,subtree:true});
    try{var params=new URLSearchParams(location.hash.replace(/^#/,''));if(params.get('type')==='recovery')showRecovery();db.auth.onAuthStateChange(function(event){if(event==='PASSWORD_RECOVERY')showRecovery();});}catch(e){}
  }
  window.addEventListener('load',function(){setTimeout(watch,500);});
})();
</script>`, { html: true });
        }
      })
      .transform(response);
  }
};
