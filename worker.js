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

  async function addAdminDeleteProfile() {
    if (!window.supabase || !document.getElementById('adminPanel')) return;
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await db.auth.getSession();
    if (!session || !session.user || session.user.id !== ADMIN_ID) return;

    const admin = document.getElementById('adminPanel');
    if (document.getElementById('adminDeleteProfile')) return;

    const box = document.createElement('div');
    box.id = 'adminDeleteProfile';
    box.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
    box.innerHTML = '<div class="muted" style="margin-bottom:8px">Delete a player profile permanently. This cannot be undone.</div>' +
      '<div class="row"><select id="deletePlayerSelect" class="field"><option value="">Select a player…</option></select>' +
      '<button id="deletePlayerBtn" type="button" class="btn danger" disabled>Delete Profile</button></div>';
    admin.appendChild(box);

    const select = document.getElementById('deletePlayerSelect');
    const button = document.getElementById('deletePlayerBtn');

    async function loadPlayers() {
      const { data, error } = await db.from('players').select('id,name,nickname').order('name');
      if (error) { console.error(error); return; }
      select.innerHTML = '<option value="">Select a player…</option>';
      (data || []).forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nickname ? p.name + ' (' + p.nickname + ')' : p.name;
        select.appendChild(option);
      });
      button.disabled = !select.value;
    }

    select.addEventListener('change', () => { button.disabled = !select.value; });
    button.addEventListener('click', async () => {
      const id = select.value;
      if (!id) return;
      const label = select.options[select.selectedIndex].textContent;
      if (!confirm('Delete ' + label + ' permanently? This will also remove their attendance and past-point records.')) return;

      button.disabled = true;
      button.textContent = 'Deleting…';

      const { error: attendanceError } = await db.from('attendance').delete().eq('player_id', id);
      if (attendanceError) { alert('Could not delete attendance records: ' + attendanceError.message); button.disabled = false; button.textContent = 'Delete Profile'; return; }
      const { error: pastError } = await db.from('past_points').delete().eq('player_id', id);
      if (pastError) { alert('Could not delete past-point records: ' + pastError.message); button.disabled = false; button.textContent = 'Delete Profile'; return; }
      const { error: historicalError } = await db.from('historical_player_points').delete().eq('player_id', id);
      if (historicalError) { alert('Could not delete historical records: ' + historicalError.message); button.disabled = false; button.textContent = 'Delete Profile'; return; }
      const { error } = await db.from('players').delete().eq('id', id);
      if (error) { alert('Could not delete profile: ' + error.message); button.disabled = false; button.textContent = 'Delete Profile'; return; }

      alert(label + ' was deleted.');
      location.reload();
    });

    await loadPlayers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addAdminDeleteProfile);
  else addAdminDeleteProfile();
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
