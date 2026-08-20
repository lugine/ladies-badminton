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
  function showRecovery(){
    if (document.getElementById('passwordRecoveryModal')) return;

    var overlay = document.createElement('div');
    overlay.id = 'passwordRecoveryModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;';

    overlay.innerHTML = `
      <div style="width:100%;max-width:380px;background:#163A30;border:1px solid rgba(250,246,237,.14);border-radius:14px;padding:22px;color:#FAF6ED;box-sizing:border-box;">
        <h2 style="margin:0 0 8px;font-family:Georgia,serif;">Set a new password</h2>
        <p style="font-size:13px;line-height:1.5;color:rgba(250,246,237,.68);margin:0 0 15px;">Enter your new password below.</p>
        <input id="recoveryPassword" type="password" autocomplete="new-password" placeholder="New password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:9px;">
        <input id="recoveryPassword2" type="password" autocomplete="new-password" placeholder="Confirm password" style="width:100%;box-sizing:border-box;background:#1F4B3F;border:1px solid rgba(250,246,237,.14);border-radius:8px;padding:11px 12px;color:#FAF6ED;font-size:15px;margin-bottom:9px;">
        <div id="recoveryMessage" style="font-size:12px;color:rgba(250,246,237,.58);min-height:18px;margin-bottom:9px;"></div>
        <button id="recoverySave" style="width:100%;border:0;border-radius:8px;padding:11px 15px;background:#D4A537;color:#211F1B;font-weight:700;font-size:14px;cursor:pointer;">Save new password</button>
      </div>`;

    document.body.appendChild(overlay);

    document.getElementById('recoverySave').onclick = async function(){
      var p1 = document.getElementById('recoveryPassword').value;
      var p2 = document.getElementById('recoveryPassword2').value;
      var msg = document.getElementById('recoveryMessage');
      if (!p1 || p1.length < 6) { msg.textContent = 'Use at least 6 characters.'; return; }
      if (p1 !== p2) { msg.textContent = 'The passwords do not match.'; return; }
      this.disabled = true;
      msg.textContent = 'Saving…';
      try {
        if (!window.supabase || !window.supabase.createClient) throw new Error('Supabase client unavailable');
        var client = window.supabase.createClient('https://zcahhfswtdrdmguppqtp.supabase.co','sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs');
        var result = await client.auth.updateUser({ password: p1 });
        if (result.error) throw result.error;
        msg.textContent = 'Password updated ✓';
        setTimeout(function(){ window.history.replaceState({}, document.title, window.location.pathname + window.location.search); overlay.remove(); }, 900);
      } catch (e) {
        this.disabled = false;
        msg.textContent = e.message || 'Could not update the password.';
      }
    };
  }

  function isRecoveryLink(){
    var hash = new URLSearchParams(window.location.hash.replace(/^#/,''));
    return hash.get('type') === 'recovery' || hash.has('access_token') && hash.get('type') === 'recovery';
  }

  function start(){
    if (!window.supabase) { setTimeout(start, 100); return; }
    if (isRecoveryLink()) {
      setTimeout(showRecovery, 200);
    }
    try {
      var client = window.supabase.createClient('https://zcahhfswtdrdmguppqtp.supabase.co','sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs');
      client.auth.onAuthStateChange(function(event){
        if (event === 'PASSWORD_RECOVERY') showRecovery();
      });
    } catch (e) {}
  }

  start();
})();
</script>`, { html: true });
        }
      })
      .transform(response);
  }
};
