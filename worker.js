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

    // Make data-loading failures visible instead of leaving sections looking empty.
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
})();
</script>`;
    html = html.replace('</body>', patch + '</body>');

    const headers = new Headers(response.headers);
    headers.set('cache-control', 'no-store');
    return new Response(html, { status: response.status, statusText: response.statusText, headers });
  }
};
