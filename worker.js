export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    let html = await response.text();

    // The public profile view intentionally omits sensitive fields such as profile_pin.
    // The frontend only needs public player fields, so use that view for all normal loading.
    html = html.replace(
      "db.from('players').select('*').order('created_at',{ascending:true})",
      "db.from('player_public_profiles').select('*').order('date_joined',{ascending:true})"
    );

    // Fix past-score saving, explain the participant rule, and make PIN setup usable.
    html = html.replace(
      "async function savePast(){const date=$('pastDate').value;if(!date)return toast('Choose the old session date');const rows=[...$('pastRows').querySelectorAll('input')].map(i=>({id:i.dataset.player,points:i.value===''?0:+i.value}));const del=await db.from('past_points').delete().eq('session_date',date);if(del.error)return toast('Could not update past points');const inserts=rows.filter(r=>Number.isFinite(r.points)&&r.points>0).map(r=>({session_date:date,player_id:r.id,points:r.points}));if(inserts.length){const ins=await db.from('past_points').insert(inserts);if(ins.error)return toast('Could not save past points')}hide('pastPanel');await load();toast('Past points saved ✓')}",
      "async function savePast(){const date=$('pastDate').value;if(!date)return toast('Choose the old session date');const rows=[...$('pastRows').querySelectorAll('input')].map(i=>({player_id:i.dataset.player,points:i.value===''?0:+i.value}));const q=await db.rpc('admin_save_past_points',{p_date:date,p_rows:rows});if(q.error)return toast(q.error.message||'Could not save past points');if(q.data!==true)return toast('Could not save past points');hide('pastPanel');await load();toast('Past points saved ✓')}",
    );

    // When a new player is created, return and display their generated 6-digit PIN.
    html = html.replace(
      "const q=await db.from('players').insert({name:first,full_name:first,nickname:nick||first,date_joined:dateKey(),active:true});if(q.error)return toast(q.error.code==='23505'?'That name is already taken. Please choose another name or contact the admin.':'Could not add player');$('firstName').value='';$('nickname').value='';await load();toast('Player added ✓')}",
      "const q=await db.from('players').insert({name:first,full_name:first,nickname:nick||first,date_joined:dateKey(),active:true}).select('id,profile_pin').single();if(q.error)return toast(q.error.code==='23505'?'That name is already taken. Please choose another name or contact the admin.':'Could not add player');$('firstName').value='';$('nickname').value='';await load();openModal('<h2 style=\"margin-top:0\">Player Added ✓</h2><p class=\"muted\">Save this 6-digit PIN. The player needs it to edit their nickname or profile photo later.</p><div style=\"font-size:34px;font-weight:800;letter-spacing:.18em;text-align:center;color:var(--gold);margin:18px 0\">'+esc(q.data.profile_pin)+'</div><button id=\"closePin\" class=\"btn gold\" type=\"button\">Done</button>');$('closePin').onclick=closeModal}",
    );

    // Add clear instructions to the profile editor.
    html = html.replace(
      "<p class=\"muted\">You can change your nickname and profile picture only. Your real name, date joined, scores, wins and attendance cannot be changed.</p>",
      "<p class=\"muted\">You can change your nickname and profile picture only. Your real name, date joined, scores, wins and attendance cannot be changed.</p><div class=\"rules\"><b>Where is my PIN?</b><br>It is the 6-digit PIN given when your player profile was created. Ask the admin for your PIN if you do not have it.</div>",
    );

    // Add an admin-only PIN lookup for existing players.
    html = html.replace(
      "<section id=\"adminPanel\" class=\"card hidden\"><h2>Admin</h2>",
      "<section id=\"adminPanel\" class=\"card hidden\"><h2>Admin</h2><button id=\"showPins\" type=\"button\" class=\"btn ghost\" style=\"margin-bottom:12px\">View Profile PINs</button><div id=\"pinsBox\" class=\"hidden\" style=\"margin-bottom:12px\"></div>",
    );

    const patch = `
<script>
(() => {
  const originalError = window.console?.error;
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason) console.error('Ladies Badminton error:', event.reason);
  });
  window.addEventListener('error', (event) => {
    if (originalError) originalError.call(console, event.error || event.message);
  });

  window.addEventListener('load', () => {
    const btn = document.getElementById('showPins');
    if (!btn) return;
    btn.onclick = async () => {
      const box = document.getElementById('pinsBox');
      const { data, error } = await db.from('players').select('name,nickname,profile_pin').order('name');
      if (error) return toast('Could not load profile PINs');
      box.innerHTML = '<div class="rules"><b>Profile PINs</b><div class="muted" style="margin-top:6px">Give each player only their own PIN.</div>' + (data || []).map(p => '<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--dim)"><span>' + esc(p.nickname || p.name) + '</span><strong style="color:var(--gold);letter-spacing:.12em">' + esc(p.profile_pin) + '</strong></div>').join('') + '</div>';
      box.classList.remove('hidden');
    };
  });
})();
</script>`;
    html = html.replace('</body>', patch + '</body>');

    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store');
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
};
