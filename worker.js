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

    /* ---------------- Admin profile photos + delete profile ---------------- */
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
          const { error: updateError } = await db.from('players').update({ avatar_url: publicData.publicUrl }).eq('id', playerId);
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
          if (error && !String(error.message || '').toLowerCase().includes('does not exist')) {
            alert('Could not delete related records: ' + error.message);
            del.disabled = false;
            del.textContent = 'Delete Profile';
            return;
          }
        }
        const { error } = await db.from('players').delete().eq('id', id);
        if (error) { alert('Could not delete profile: ' + error.message); del.disabled = false; del.textContent = 'Delete Profile'; return; }
        alert(label + ' was deleted.');
        location.reload();
      });
      await loadProfiles();
    }

    /* ---------------- FIXED: old-session / past-game points ---------------- */
    if (!document.getElementById('adminPastPointsTools')) {
      const box = document.createElement('div');
      box.id = 'adminPastPointsTools';
      box.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid rgba(250,246,237,.14)';
      box.innerHTML = '<div style="font-weight:700;color:#E8C978;margin-bottom:8px">Add Points to an Old Session</div>' +
        '<div class="muted" style="margin-bottom:8px">Use this for games played before the leaderboard was entered. Choose the old date, enter each player’s points, then save.</div>' +
        '<div class="row"><select id="adminPastDate" class="field"><option value="">Select an old session…</option></select><button id="adminPastLoad" type="button" class="btn ghost" disabled>Load Points</button></div>' +
        '<div id="adminPastRows" style="margin-top:10px"></div>' +
        '<button id="adminPastSave" type="button" class="btn gold" style="width:100%;margin-top:12px" disabled>Save Old-Game Points</button>' +
        '<div id="adminPastStatus" class="muted" style="margin-top:7px"></div>';
      admin.appendChild(box);

      const dateSelect = document.getElementById('adminPastDate');
      const loadBtn = document.getElementById('adminPastLoad');
      const rows = document.getElementById('adminPastRows');
      const saveBtn = document.getElementById('adminPastSave');
      const status = document.getElementById('adminPastStatus');
      let oldPlayers = [];

      function dayKey(value) {
        const d = new Date(value);
        return isNaN(d) ? '' : d.toISOString().slice(0,10);
      }

      async function buildDates() {
        const [{ data: gs }, { data: ps }] = await Promise.all([
          db.from('games').select('played_at,week_id').order('played_at', { ascending: false }),
          db.from('past_points').select('session_date').order('session_date', { ascending: false })
        ]);
        const dates = new Set();
        (gs || []).forEach(g => { const d = dayKey(g.played_at); if (d) dates.add(d); });
        (ps || []).forEach(p => { if (p.session_date) dates.add(p.session_date); });
        dateSelect.innerHTML = '<option value="">Select an old session…</option>';
        [...dates].sort().reverse().forEach(d => {
          const o = document.createElement('option');
          o.value = d;
          o.textContent = new Date(d + 'T00:00:00').toLocaleDateString(undefined, {weekday:'short',month:'short',day:'numeric',year:'numeric'});
          dateSelect.appendChild(o);
        });
        dateSelect.insertAdjacentHTML('beforeend','<option value="__new__">Other date…</option>');
        loadBtn.disabled = true;
      }

      dateSelect.addEventListener('change', async () => {
        if (dateSelect.value === '__new__') {
          const d = prompt('Enter the old session date as YYYY-MM-DD:');
          if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(d || '')) { dateSelect.value=''; loadBtn.disabled=true; return; }
          let opt = [...dateSelect.options].find(o => o.value === d);
          if (!opt) { opt = new Option(new Date(d+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'}),d); dateSelect.insertBefore(opt,dateSelect.lastElementChild); }
          dateSelect.value=d;
        }
        loadBtn.disabled = !dateSelect.value;
        status.textContent='';
        if (dateSelect.value) await loadOldPoints();
      });

      loadBtn.addEventListener('click', loadOldPoints);

      async function loadOldPoints() {
        const date = dateSelect.value;
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date || '')) return;
        const [{ data: ps, error: pe }, { data: existing, error: ee }] = await Promise.all([
          db.from('players').select('id,name,nickname,full_name').order('name'),
          db.from('past_points').select('player_id,points').eq('session_date', date)
        ]);
        if (pe || ee) { status.textContent='Could not load old-session points.'; console.error(pe || ee); return; }
        oldPlayers = ps || [];
        const byPlayer = new Map((existing || []).map(x => [x.player_id, Number(x.points) || 0]));
        rows.innerHTML = '';
        oldPlayers.filter(p => p.active !== false).forEach(p => {
          const row = document.createElement('div');
          row.className='past-row';
          row.innerHTML='<div><strong>'+escapeHtml(p.nickname || p.name)+'</strong><div class="muted">'+escapeHtml(p.full_name || p.name || '')+'</div></div>';
          const input=document.createElement('input');
          input.className='field'; input.type='number'; input.min='0'; input.max='99'; input.step='1'; input.value=String(byPlayer.get(p.id) || 0); input.dataset.player=p.id;
          row.appendChild(input); rows.appendChild(row);
        });
        saveBtn.disabled = false;
        status.textContent = existing && existing.length ? 'Existing points loaded. Change them and save.' : 'No points entered for this date yet.';
      }

      function escapeHtml(value) {
        const d=document.createElement('div'); d.textContent=value == null ? '' : value; return d.innerHTML;
      }

      saveBtn.addEventListener('click', async () => {
        const date=dateSelect.value;
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date || '')) return;
        saveBtn.disabled=true; saveBtn.textContent='Saving…'; status.textContent='';
        try {
          const inputs=[...rows.querySelectorAll('input[data-player]')];
          const values=inputs.map(i => ({player_id:i.dataset.player,points:Math.max(0,Math.min(99,Number(i.value)||0))}));
          const del=await db.from('past_points').delete().eq('session_date',date);
          if (del.error) throw del.error;
          const inserts=values.filter(v=>v.points>0);
          if (inserts.length) {
            const ins=await db.from('past_points').insert(inserts);
            if (ins.error) throw ins.error;
          }
          status.textContent='Saved successfully ✓';
          saveBtn.textContent='Saved ✓';
          setTimeout(()=>location.reload(),700);
        } catch(e) {
          console.error(e);
          status.textContent='Could not save: '+(e.message || e);
          saveBtn.disabled=false; saveBtn.textContent='Save Old-Game Points';
        }
      });
      await buildDates();
    }
  }

  let tries=0;
  const timer=setInterval(()=>{setupAdminTools();if(++tries>40)clearInterval(timer)},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupAdminTools);else setupAdminTools();
})();
</script>`;
    const body=html.includes('</body>')?html.replace('</body>',injection+'</body>'):html+injection;
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }
};
