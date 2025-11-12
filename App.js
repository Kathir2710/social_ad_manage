

const FB_APP_ID = '2766175383577129'; // <-- replace with your FB App ID
const GOOGLE_CLIENT_ID = '909323253369-817lthmrt17refrp225q39h4nkqsp2tj.apps.googleusercontent.com'; // <-- replace with your Google Web client ID


const FB_SCOPES = 'public_profile,pages_show_list,pages_manage_posts,pages_read_engagement,ads_read,ads_management,business_management,instagram_basic,instagram_manage_insights,instagram_content_publish';
let userAccessToken=null, pages=[], selectedPage=null, adAccounts=[], selectedAdAccount=null;
let pageChart=null, instaChart=null, twitterChart=null, ytChart=null, adChart=null;

/* ---------------------------
   FACEBOOK: init + helpers
   --------------------------- */
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

document.getElementById('btnLogin').onclick = () => {
  FB.login(checkLoginState, { scope: FB_SCOPES });
};
document.getElementById('btnLogout').onclick = () => {
  FB.logout(()=> location.reload());
};

// fetch ad accounts
function fetchAdAccounts(){
  document.getElementById('adAccountsList').textContent = 'Loading...';
  FB.api('/me/adaccounts','GET',{access_token:userAccessToken}, r => {
    if (!r || r.error) {
      document.getElementById('adAccountsList').textContent = 'Failed to load ad accounts.';
      console.error('AdAccounts error', r);
      return;
    }
    adAccounts = r.data || [];
    if(!adAccounts.length) {
      document.getElementById('adAccountsList').textContent = 'No Ad Accounts found.';
      return;
    }
    document.getElementById('adAccountsList').innerHTML = adAccounts.map((a,i)=>{
      return `<strong>${a.name || a.account_id}</strong> (ID: ${a.account_id || a.id}) <button onclick="selectAdAccount(${i})">Select</button><br>`;
    }).join('');
  });
}
window.selectAdAccount = (i) => {
  selectedAdAccount = adAccounts[i];
  document.getElementById('selectedAdAccount').innerText = `Selected Ad Account: ${selectedAdAccount.name || selectedAdAccount.account_id}`;
};

// ad insights
document.getElementById('btnGetAdInsights').onclick = () => {
  if(!selectedAdAccount) return alert('Select an ad account first');
  const datePreset='last_7d';
  const fields='spend,impressions,clicks';
  FB.api(`/${selectedAdAccount.id}/insights`,'GET',{fields,date_preset:datePreset,access_token:userAccessToken}, res => {
    if(!res || res.error) {
      document.getElementById('adInsightsResult').textContent = 'Failed to load ad insights.';
      console.error('AdInsights error', res);
      return;
    }
    if(res.data && res.data.length) {
      const d = res.data[0];
      document.getElementById('adInsightsResult').textContent = JSON.stringify(d, null, 2);
      const metrics = { Spend: d.spend || 0, Impressions: d.impressions || 0, Clicks: d.clicks || 0 };
      if(adChart) adChart.destroy();
      adChart = new Chart(document.getElementById('adChart'), { type:'bar', data:{ labels:Object.keys(metrics), datasets:[{ data:Object.values(metrics), backgroundColor:'#f57c00' }]}});
    } else {
      document.getElementById('adInsightsResult').textContent = 'No insights returned.';
    }
  });
};

// fetch pages
function fetchPages(){
  document.getElementById('pagesList').textContent = 'Loading...';
  FB.api('/me/accounts','GET',{access_token:userAccessToken}, r => {
    if(!r || r.error) {
      document.getElementById('pagesList').textContent = 'Failed to load pages.';
      console.error('Pages error', r);
      return;
    }
    pages = r.data || [];
    if(!pages.length) {
      document.getElementById('pagesList').textContent = 'No Pages found.';
      return;
    }
    document.getElementById('pagesList').innerHTML = pages.map((p,i)=>`<strong>${p.name}</strong> <button onclick="selectPage(${i})">Select</button><br>`).join('');
  });
}
window.selectPage = (i) => {
  selectedPage = pages[i];
  document.getElementById('selectedPageName').textContent = selectedPage.name;
};

// post to page
document.getElementById('btnPost').onclick = () => {
  if(!selectedPage) return alert('Select a page first');
  const msg = document.getElementById('postMessage').value || '';
  fetch(`https://graph.facebook.com/v19.0/${selectedPage.id}/feed`, {
    method:'POST',
    body: new URLSearchParams({ message: msg, access_token: selectedPage.access_token })
  }).then(r=>r.json()).then(d => {
    document.getElementById('postResult').textContent = JSON.stringify(d, null, 2);
  }).catch(e=>{
    console.error(e);
    document.getElementById('postResult').textContent = 'Post failed. See console.';
  });
};

// page insights
document.getElementById('btnGetPageInsights').onclick = () => {
  if(!selectedPage) return alert('Select page first');
  const metric = document.getElementById('insightsMetric').value;
  FB.api(`/${selectedPage.id}/insights`, { metric, period:'days_7', access_token: selectedPage.access_token }, r => {
    if(!r || r.error) { document.getElementById('postResult').textContent='Failed to fetch insights'; console.error(r); return; }
    if(r.data && r.data[0]) {
      const labels = r.data[0].values.map(v=>v.end_time.split('T')[0]);
      const values = r.data[0].values.map(v=>v.value);
      if(pageChart) pageChart.destroy();
      pageChart = new Chart(document.getElementById('pageChart'), { type:'line', data:{ labels, datasets:[{ label: metric, data: values, borderColor:'#4267B2', fill:true, backgroundColor:'rgba(66,103,178,0.18)'}] }});
    } else {
      document.getElementById('postResult').textContent = 'No insights returned.';
    }
  });
};

/* ---------------------------
   INSTAGRAM (via connected page)
   --------------------------- */

// Fetch linked Instagram info
document.getElementById('btnGetInstagramInfo').onclick = () => {
  if (!selectedPage) return alert('Select page first');
  FB.api(`/${selectedPage.id}?fields=instagram_business_account`, { access_token: selectedPage.access_token }, r => {
    if (!r || r.error) {
      document.getElementById('instaInfo').textContent = 'Error fetching IG account';
      console.error(r);
      return;
    }
    if (!r.instagram_business_account) {
      document.getElementById('instaInfo').textContent = 'No IG account linked to this page.';
      return;
    }
    const igId = r.instagram_business_account.id;
    FB.api(`/${igId}?fields=username,followers_count,media_count,profile_picture_url`, { access_token: selectedPage.access_token }, res => {
      document.getElementById('instaInfo').textContent = JSON.stringify(res, null, 2);
    });
  });
};

// Create and publish Instagram post
document.getElementById('btnInstaPost').onclick = () => {
  if (!selectedPage) return alert('Select page first');
  const img = document.getElementById('instaImageUrl').value.trim();
  const caption = document.getElementById('instaCaption').value || '';
  if (!img) return alert('Provide an image URL for IG post.');
  FB.api(`/${selectedPage.id}?fields=instagram_business_account`, { access_token: selectedPage.access_token }, r => {
    if (!r || !r.instagram_business_account) return alert('No IG linked');
    const igId = r.instagram_business_account.id;
    // create media
    fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
      method: 'POST',
      body: new URLSearchParams({ image_url: img, caption, access_token: selectedPage.access_token })
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          document.getElementById('instaPostResult').textContent = JSON.stringify(d, null, 2);
          return;
        }
        // publish
        fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
          method: 'POST',
          body: new URLSearchParams({ creation_id: d.id, access_token: selectedPage.access_token })
        })
          .then(rr => rr.json())
          .then(pub => document.getElementById('instaPostResult').textContent = JSON.stringify(pub, null, 2))
          .catch(e => {
            console.error(e);
            document.getElementById('instaPostResult').textContent = 'Publish failed';
          });
      })
      .catch(e => {
        console.error(e);
        document.getElementById('instaPostResult').textContent = 'Create media failed';
      });
  });
};

// Fetch Instagram Organic Insights
document.getElementById('btnGetInstaInsights').onclick = () => {
  if (!selectedPage) return alert('Select page first');

  FB.api(`/${selectedPage.id}?fields=instagram_business_account`, { access_token: selectedPage.access_token }, r => {
    if (!r || !r.instagram_business_account) return alert('No IG linked');
    const igId = r.instagram_business_account.id;

    FB.api(
      `/${igId}/insights?metric=reach,profile_views,accounts_engaged,total_interactions,follower_count&period=days_7`,
      { access_token: selectedPage.access_token },
      res => {
        if (!res || res.error) {
          document.getElementById('instaInfo').textContent = '❌ Failed to fetch Instagram insights';
          console.error('IG Insights error', res);
          return;
        }

        if (res.data && res.data.length) {
          let summaryHTML = '<h3>📊 Instagram Insights (Last 7 Days)</h3><ul>';
          res.data.forEach(metric => {
            const name = metric.title || metric.name;
            const value = metric.values[0]?.value || 0;
            summaryHTML += `<li><strong>${name}:</strong> ${value}</li>`;
          });
          summaryHTML += '</ul>';
          document.getElementById('instaInfo').innerHTML = summaryHTML;

          const labels = res.data.map(i => i.name.toUpperCase());
          const values = res.data.map(i => i.values[0].value);
          const colors = ['#E1306C', '#FCAF45', '#833AB4', '#0095F6', '#FFCE56'];

          if (instaChart) instaChart.destroy();
          instaChart = new Chart(document.getElementById('instaChart'), {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Instagram Metrics',
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderRadius: 10
              }]
            },
            options: {
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Instagram Performance (Last 7 Days)', color: '#E1306C' }
              },
              scales: {
                y: { beginAtZero: true },
                x: { ticks: { color: '#333' } }
              }
            }
          });
        } else {
          document.getElementById('instaInfo').textContent = 'No Instagram insights returned.';
        }
      }
    );
  });
};

/* ---------------------------
   INSTAGRAM AD METRICS (via Ad Account)
   --------------------------- */

document.getElementById('btnGetInstaAdMetrics').onclick = () => {
  if (!selectedAdAccount) return alert('Select ad account first.');

  const adAccountId = selectedAdAccount.id.replace('act_', '');
  const fields = 'campaign_name,impressions,clicks,spend,reach,ctr';
  const datePreset = 'last_7d';

  FB.api(
    `/act_${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}`,
    'GET',
    { access_token: userAccessToken },
    res => {
      if (!res || res.error) {
        console.error('Instagram Ad Metrics Error:', res);
        document.getElementById('instaInfo').textContent = '❌ Failed to fetch Instagram Ad metrics.';
        return;
      }

      document.getElementById('instaInfo').textContent = JSON.stringify(res, null, 2);

      // Chart
      if (res.data && res.data.length) {
        const labels = res.data.map(c => c.campaign_name || 'Unknown');
        const impressions = res.data.map(c => c.impressions || 0);
        const clicks = res.data.map(c => c.clicks || 0);

        new Chart(document.getElementById('instaChart'), {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Impressions', data: impressions },
              { label: 'Clicks', data: clicks }
            ]
          }
        });
      }
    }
  );
};


const BACKEND_URL = "https://social-ads-backend.onrender.com";

const CLIENT_ID = "909323253369-817lthmrt17refrp225q39h4nkqsp2tj.apps.googleusercontent.com";
const customerId = "5368806709";

let ytAccessToken = null, ytTokenClient = null;

// Init GAPI client
function gapiInit() {
  gapi.load("client", () => {
    gapi.client.setApiKey("AIzaSyDRV6_ZEnQMdcMIhbhDYJP9OSayla3AV48");
    gapi.client.load("youtube", "v3");
  });
}

window.addEventListener("load", () => {
  gapiInit();
  ytTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/adwords",
    callback: (resp) => {
      ytAccessToken = resp.access_token;
      document.getElementById("ytStatus").textContent = "✅ Logged in";
      document.getElementById("btnGoogleLogin").style.display = "none";
      document.getElementById("btnGoogleLogout").style.display = "inline-block";
    },
  });
});

document.getElementById("btnGoogleLogin").onclick = () => ytTokenClient.requestAccessToken({ prompt: "consent" });
document.getElementById("btnGoogleLogout").onclick = () => location.reload();

// Upload
document.getElementById("uploadForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!ytAccessToken) return alert("Login first.");
  const file = document.getElementById("videoFile").files[0];
  const formData = new FormData();
  formData.append("video", file);
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("privacyStatus", document.getElementById("privacy").value);

  const res = await fetch(`${BACKEND_URL}/upload-video`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ytAccessToken}` },
    body: formData,
  });

  const data = await res.json();
  document.getElementById("ytUploadResult").textContent = JSON.stringify(data, null, 2);
};

// Fetch Metrics
document.getElementById("btnFetchMetrics").onclick = async () => {
  const res = await fetch(`${BACKEND_URL}/googleads-metrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      developerToken: "aDfTg_put93gcMI_8e293g",
      customerId: "5368806709",
      accessToken: ytAccessToken
    })
  });

  const data = await res.json();
  document.getElementById("metricsResult").textContent = JSON.stringify(data, null, 2);

  const labels = data[0]?.results?.map(r => r.campaign.name) || [];
  const impressions = data[0]?.results?.map(r => r.metrics.impressions) || [];
  const clicks = data[0]?.results?.map(r => r.metrics.clicks) || [];

  new Chart(document.getElementById("ytChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Impressions", data: impressions },
        { label: "Clicks", data: clicks }
      ]
    },
  });
};
