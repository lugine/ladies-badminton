export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;

    const html = await response.text();
    const injection = `
<script>
(function () {
  'use strict';
  const SUPABASE_URL = 'https://zcahhfswtdrdmguppqtp.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_CeiB5DOuyX7xKdK87tK2QQ_5Y9phmOs';
  const ADMIN_ID = 'a517d9bd-bc9c-4e59-b36d-503747621aa4';

  async function setupAdminTools() {
    if (!window.supabase) return;
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await db.auth.getSession();
    if (!session || !session.user || session.user.id !== ADMIN_ID) return;

    const admin = document.getElementById('adminPanel');
    if (!admin) return;

    /* ---------------- Profile PINs + delete profile ---------------- */
    if (!document.getElementById('adminProfileTools')) {
      const box = document.createElement('div');
      box.id = 'adminProfileTools';
      box.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
      box.innerHTML = '<div style="font-weight:700;color:#E8C978;margin-bottom:8px">Profile Management</div>' +
        '<div class="muted" style="margin-bottom:8px">Use the player PIN when that player opens their profile to upload/change their photo.</div>' +
        '<div class="row"><select id="adminProfileSelect" class="field"><option value="">Select a player…</option></select>' +
        '<button id="adminProfileDelete" type="button" class="btn danger" disabled>Delete Profile</button></div>' +
        '<div id="adminPinDisplay" style="margin-top:10px"></div>';
      admin.appendChild(box);

      const select = document.getElementById('adminProfileSelect');
      const del = document.getElementById('adminProfileDelete');
      const pin = document.getElementById('adminPinDisplay');

      async function loadProfiles() {
        const { data, error } = await db.from('players').select('id,name,nickname,profile_pin').order('name');
        if (error) { console.error(error); return; }
        select.innerHTML = '<option value="">Select a player…</option>';
        (data || []).forEach(p => {
          const o = document.createElement('option');
          o.value = p.id;
          o.textContent = p.nickname ? p.name + ' (' + p.nickname + ')' : p.name;
          o.dataset.pin = p.profile_pin || '';
          select.appendChild(o);
        });
        del.disabled = true;
        pin.innerHTML = '';
      }

      select.addEventListener('change', () => {
        const o = select.options[select.selectedIndex];
        const has = !!select.value;
        del.disabled = !has;
        if (!has) { pin.innerHTML = ''; return; }
        const p = o.dataset.pin || 'No PIN assigned';
        pin.innerHTML = '<div style="padding:12px;border:1px solid rgba(212,165,55,.3);border-radius:10px;background:rgba(212,165,55,.08)">' +
          '<div class="muted">6-digit profile PIN</div><div style="font-size:28px;letter-spacing:.18em;font-weight:800;color:#D4A537;margin-top:3px">' + p + '</div></div>';
      });

      del.addEventListener('click', async () => {
        const id = select.value;
        if (!id) return;
        const label = select.options[select.selectedIndex].textContent;
        if (!confirm('Delete ' + label + ' permanently? Their attendance and past-point records will also be removed.')) return;
        del.disabled = true;
        del.textContent = 'Deleting…';
        for (const table of ['attendance','past_points','historical_player_points']) {
          const { error } = await db.from(table).delete().eq('player_id', id);
          if (error) { alert('Could not delete related records: ' + error.message); del.disabled = false; del.textContent = 'Delete Profile'; return; }
        }
        const { error } = await db.from('players').delete().eq('id', id);
        if (error) { alert('Could not delete profile: ' + error.message); del.disabled = false; del.textContent = 'Delete Profile'; return; }
        alert(label + ' was deleted.');
        location.reload();
      });

      await loadProfiles();
    }

    /* ---------------- Delete accidental games ---------------- */
    const manage = document.getElementById('managePanel');
    if (manage && !document.getElementById('adminGameDeleteTools')) {
      const box = document.createElement('div');
      box.id = 'adminGameDeleteTools';
      box.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
      box.innerHTML = '<div style="font-weight:700;color:#E8C978;margin-bottom:8px">Delete Accidental Game</div>' +
        '<div class="muted" style="margin-bottom:8px">Select a recorded game to permanently remove it from the standings.</div>' +
        '<div class="row"><select id="adminGameSelect" class="field"><option value="">Select a game…</option></select>' +
        '<button id="adminGameDelete" type="button" class="btn danger" disabled>Delete Game</button></div>';
      manage.appendChild(box);

      const select = document.getElementById('adminGameSelect');
      const del = document.getElementById('adminGameDelete');

      async function loadGames() {
        const { data, error } = await db.from('games').select('id,played_at,winners,losers,winner_score,loser_score').order('played_at', { ascending: false });
        if (error) { console.error(error); return; }
        select.innerHTML = '<option value="">Select a game…</option>';
        (data || []).forEach(g => {
          const date = g.played_at ? new Date(g.played_at).toLocaleString(undefined, {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : 'Game';
          const score = (g.winner_score ?? '—') + '–' + (g.loser_score ?? '—');
          const o = document.createElement('option');
          o.value = g.id;
          o.textContent = date + ' · ' + score;
          select.appendChild(o);
        });
        del.disabled = true;
      }

      select.addEventListener('change', () => { del.disabled = !select.value; });
      del.addEventListener('click', async () => {
        const id = select.value;
        if (!id) return;
        const label = select.options[select.selectedIndex].textContent;
        if (!confirm('Delete this game (' + label + ')? This will remove its points from the leaderboard.')) return;
        del.disabled = true;
        del.textContent = 'Deleting…';
        const { error } = await db.from('games').delete().eq('id', id);
        if (error) { alert('Could not delete game: ' + error.message); del.disabled = false; del.textContent = 'Delete Game'; return; }
        alert('Game deleted.');
        location.reload();
      });
      await loadGames();
    }
  }

  /* The main app reveals the admin panel after its own auth check, so keep trying briefly. */
  let tries = 0;
  const timer = setInterval(() => {
    setupAdminTools();
    if (++tries > 30) clearInterval(timer);
  }, 500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupAdminTools);
  else setupAdminTools();
})();
</script>`;

    const body = html.includes('</body>') ? html.replace('</body>', injection + '</body>') : html + injection;
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
};
