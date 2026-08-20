export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return response;
    }

    return new HTMLRewriter()
      .on("body", {
        element(element) {
          element.append(`<script>
(function(){
  function localKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function updateDate(){
    var d=new Date();
    var date=document.getElementById("dateLine");
    if(date) date.textContent=d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    var status=document.getElementById("status");
    if(status && status.textContent.trim()==="Connecting…") status.textContent="Online ✓";
  }
  function nextGame(now){
    var blackouts={"2026-08-27":true};
    var d=new Date(now); d.setHours(0,0,0,0);
    for(var i=0;i<21;i++){
      if(d.getDay()===4){
        var key=localKey(d);
        if(!blackouts[key]){
          var start=new Date(d), end=new Date(d);
          start.setHours(18,0,0,0); end.setHours(20,0,0,0);
          if(now<end) return {date:d,start:start,end:end,active:now>=start};
        }
      }
      d.setDate(d.getDate()+1);
    }
    return null;
  }
  function ensurePanel(){
    var head=document.querySelector(".head");
    if(!head || document.getElementById("nextGameInjected")) return;
    var box=document.createElement("div");
    box.id="nextGameInjected";
    box.style.cssText="margin-top:10px;background:rgba(212,165,55,.10);border:1px solid rgba(212,165,55,.25);border-radius:11px;padding:11px 13px;text-align:left";
    box.innerHTML='<div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#E8C978">Next game</div><div id="nextGameTitleInjected" style="font-size:17px;font-weight:800;margin-top:4px">Loading schedule…</div><div id="nextGameTimeInjected" style="font-size:12px;color:rgba(250,246,237,.65);margin-top:3px"></div><div id="countdownInjected" style="font-size:15px;font-weight:800;color:#D4A537;margin-top:7px"></div>';
    head.appendChild(box);
  }
  function updateCountdown(){
    ensurePanel();
    var now=new Date(), g=nextGame(now); if(!g)return;
    var title=document.getElementById("nextGameTitleInjected"), meta=document.getElementById("nextGameTimeInjected"), count=document.getElementById("countdownInjected");
    if(!title||!meta||!count)return;
    var day=g.date.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
    title.textContent=g.active?"Happening now · "+day:((localKey(g.date)===localKey(now))?"Today":day)+" · 6–8 PM";
    meta.textContent=g.active?"Game time: 6–8 PM":"Thursday session";
    var target=g.active?g.end:g.start, sec=Math.max(0,Math.floor((target-now)/1000));
    var days=Math.floor(sec/86400); sec%=86400; var h=Math.floor(sec/3600); sec%=3600; var m=Math.floor(sec/60); var s=sec%60;
    count.textContent=g.active?`Ends in ${h}h ${m}m ${s}s`:`Starts in ${days?days+"d ":""}${h}h ${m}m ${s}s`;
  }
  updateDate(); ensurePanel(); updateCountdown();
  setInterval(updateDate,60000); setInterval(updateCountdown,1000);
})();
</script>`, { html: true });
        }
      })
      .transform(response);
  }
};
