const FB_APP_ID = '2766175383577129';
const FB_SCOPES = 'public_profile,pages_show_list,pages_manage_posts,pages_read_engagement,ads_read,ads_management,business_management,instagram_basic,instagram_manage_insights,instagram_content_publish';

let userAccessToken=null, pages=[], selectedPage=null, adAccounts=[], selectedAdAccount=null;
let pageChart=null, instaChart=null, adChart=null;

// ✅ Only initialize after SDK loaded
window.fbAsyncInit = function() {
  FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
  FB.getLoginStatus(checkLoginState);
};

function checkLoginState(response) {
  if (response && response.status === 'connected') {
    userAccessToken = response.authResponse.accessToken;
    document.getElementById('btnLogin').style.display='none';
    document.getElementById('btnLogout').style.display='inline-block';
    document.getElementById('status').textContent = '✅ Logged in (Facebook)';
    fetchAdAccounts();
    fetchPages();
  } else {
    document.getElementById('status').textContent = 'Not logged in.';
  }
}

document.getElementById('btnLogin').onclick = () => FB.login(checkLoginState, { scope: FB_SCOPES });
document.getElementById('btnLogout').onclick = () => FB.logout(()=> location.reload());

// --- ad accounts ---
function fetchAdAccounts(){
  document.getElementById('adAccountsList').textContent = 'Loading...';
  FB.api('/me/adaccounts','GET',{access_token:userAccessToken}, r => {
    if (!r || r.error) return console.error('AdAccounts error', r);
    adAccounts = r.data || [];
    document.getElementById('adAccountsList').innerHTML =
      adAccounts.map((a,i)=>`<strong>${a.name || a.account_id}</strong> (ID:${a.account_id}) <button onclick="selectAdAccount(${i})">Select</button><br>`).join('');
  });
}
window.selectAdAccount = i => {
  selectedAdAccount = adAccounts[i];
  document.getElementById('selectedAdAccount').innerText = `Selected Ad Account: ${selectedAdAccount.name || selectedAdAccount.account_id}`;
};

// --- insights ---
document.getElementById('btnGetAdInsights').onclick = () => {
  if(!selectedAdAccount) return alert('Select ad account first');
  FB.api(`/${selectedAdAccount.id}/insights`,'GET',{fields:'spend,impressions,clicks',date_preset:'last_7d',access_token:userAccessToken},res=>{
    if(!res||res.error) return console.error('AdInsights error',res);
    const d=res.data[0];
    document.getElementById('adInsightsResult').textContent=JSON.stringify(d,null,2);
    const metrics={Spend:d.spend||0,Impressions:d.impressions||0,Clicks:d.clicks||0};
    if(adChart) adChart.destroy();
    adChart=new Chart(document.getElementById('adChart'),{type:'bar',data:{labels:Object.keys(metrics),datasets:[{data:Object.values(metrics),backgroundColor:'#f57c00'}]}});
  });
};

// --- pages ---
function fetchPages(){
  document.getElementById('pagesList').textContent = 'Loading...';
  FB.api('/me/accounts','GET',{access_token:userAccessToken}, r => {
    if(!r||r.error)return console.error('Pages error',r);
    pages=r.data||[];
    document.getElementById('pagesList').innerHTML=pages.map((p,i)=>`<strong>${p.name}</strong> <button onclick="selectPage(${i})">Select</button><br>`).join('');
  });
}
window.selectPage=i=>{
  selectedPage=pages[i];
  document.getElementById('selectedPageName').textContent=selectedPage.name;
};

// --- posting ---
document.getElementById('btnPost').onclick=()=>{
  if(!selectedPage)return alert('Select a page first');
  const msg=document.getElementById('postMessage').value;
  fetch(`https://graph.facebook.com/v19.0/${selectedPage.id}/feed`,{
    method:'POST',
    body:new URLSearchParams({message:msg,access_token:selectedPage.access_token})
  }).then(r=>r.json()).then(d=>document.getElementById('postResult').textContent=JSON.stringify(d,null,2));
};

// --- page insights ---
// --- PAGE INSIGHTS (Fans, Impressions, Engagement) ---
document.getElementById("btnGetPageInsights").onclick = () => {
  if (!selectedPage) {
    alert("Select page first");
    return;
  }

  const metrics = "page_fans,page_impressions,page_engaged_users";

  FB.api(
    `/${selectedPage.id}/insights?metric=${metrics}&period=days_7`,
    { access_token: selectedPage.access_token },
    (res) => {
      if (!res || res.error) {
        console.error("Page Insights Error:", res);
        document.getElementById("postResult").innerText = "Failed to fetch insights.";
        return;
      }

      console.log("Page Insights:", res);

      // Extract data
      const fans = res.data.find(m => m.name === "page_fans");
      const impressions = res.data.find(m => m.name === "page_impressions");
      const engaged = res.data.find(m => m.name === "page_engaged_users");

      // Values
      const fansValue = fans?.values[0]?.value || 0;
      const impressionsValue = impressions?.values[0]?.value || 0;
      const engagedValue = engaged?.values[0]?.value || 0;

      // Display the metrics in UI
      document.getElementById("postResult").innerHTML = `
        <b>📊 Page Insights (Last 7 Days)</b><br><br>
        ⭐ <b>Fans:</b> ${fansValue}<br>
        👀 <b>Impressions:</b> ${impressionsValue}<br>
        🔥 <b>Engaged Users:</b> ${engagedValue}<br><br>
      `;

      // Create Chart
      const labels = ["Fans", "Impressions", "Engaged Users"];
      const values = [fansValue, impressionsValue, engagedValue];

      if (pageChart) pageChart.destroy();

      pageChart = new Chart(document.getElementById("pageChart"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Page Metrics (7 Days)",
            data: values,
            backgroundColor: ["#4267B2", "#f57c00", "#00796b"]
          }]
        }
      });
    }
  );
};
