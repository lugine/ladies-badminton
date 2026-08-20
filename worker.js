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
    if (!session || session.user?.id !== ADMIN_ID) return;

    const admin = document.getElementById('adminPanel');
    if (!admin) return;

    if (!document.getElementById('adminProfileTools')) {
      const box = document.createElement('div');
      box.id = 'adminProfileTools';
      box.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
      box.innerHTML = '<div style="font-weight:700;color:#E8C978;margin-bottom:8px">Profile Photos</div>' +
        '<div class="muted" style="margin-bottom:8px">Only the admin can add or change profile photos.</div>' +
        '<div class="row"><select id="adminPhotoSelect" class="field"><option value="">Select a player…</option></select><button id="adminPhotoBtn" type="button" class="btn gold" disabled>Choose Photo</button></div>' +
        '<input id="adminPhotoFile" type="file" accept="image/*" style="display:none">' +
        '<div id="adminPhotoStatus" class="muted" style="margin-top:7px"></div>' +
        '<div style="margin-top:12px"><button id="adminProfileDelete" type="button" class="btn danger" disabled>Delete Profile</button></div>';
      admin.appendChild(box);

      const select = document.getElementById('adminPhotoSelect');
      const photoBtn = document.getElementById('adminPhotoBtn');
      const file = document.getElementById('adminPhotoFile');
      const status = document.getElementById('adminPhotoStatus');
      const del = document.getElementById('adminProfileDelete');

      async function loadProfiles() {
        const { data, error } = await db.from('players').select('id,name,nickname').order('name');
        if (error) { console.error(error); return; }
        select.innerHTML = '<option value="">Select a player…</option>';
        (data || []).forEach(p => {
          const o = document.createElement('option');
          o.value = p.id;
          o.textContent = p.nickname ? p.name + ' (' + p.nickname + ')' : p.name;
          select.appendChild(o);
        });
        photoBtn.disabled = !select.value;
        del.disabled = !select.value;
      }

      select.addEventListener('change', () => {
        photoBtn.disabled = !select.value;
        del.disabled = !select.value;
        status.textContent = '';
      });
      photoBtn.addEventListener('click', () => file.click());

      file.addEventListener('change', async () => {
        const selected = file.files?.[0];
        const playerId = select.value;
        if (!selected || !playerId) return;
        if (!selected.type.startsWith('image/')) { alert('Please choose an image.'); return; }
        if (selected.size > 5 * 1024 * 1024) { alert('Please choose an image smaller than 5 MB.'); return; }

        photoBtn.disabled = true;
        status.textContent = 'Uploading photo…';
        try {
          const ext = (selected.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
          const path = playerId + '-' + Date.now() + '.' + ext;
          const { error: uploadError } = await db.storage.from('profile-photos').upload(path, selected, { upsert: false, contentType: selected.type });
          if (uploadError) throw uploadError;
          const { data: publicData } = db.storage.from('profile-photos').getPublicUrl(path);
          const photoUrl = publicData.publicUrl;
          const { error: updateError } = await db.from('players').update({ photo_url: photoUrl }).eq('id', playerId);
          if (updateError) throw updateError;
          status.textContent = 'Photo uploaded successfully.';
          file.value = '';
          setTimeout(() => location.reload(), 500);
        } catch (e) {
          console.error(e);
          status.textContent = '';
          alert('Could not upload photo: ' + (e.message || e));
          photoBtn.disabled = false;
        }
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
  }

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
