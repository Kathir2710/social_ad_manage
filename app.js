/* ---------------------------
   SIDEBAR NAVIGATION
--------------------------- */
const navItems = document.querySelectorAll(".sidebar li");
const sections = document.querySelectorAll("main section");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const sectionToShow = item.getAttribute("data-section");
    sections.forEach(sec => sec.classList.add("hidden"));
    document.getElementById(`${sectionToShow}-section`).classList.remove("hidden");
  });
});

/* ---------------------------
   FACEBOOK + GOOGLE AUTH
--------------------------- */
const FB_APP_ID = '2766175383577129';
const GOOGLE_CLIENT_ID = '909323253369-817lthmrt17refrp225q39h4nkqsp2tj.apps.googleusercontent.com';
const BACKEND_URL = "https://social-ads-backend.onrender.com";

let userAccessToken = null, selectedAdAccount = null, adChart = null;
let ytAccessToken = null, ytTokenClient = null;

/* FACEBOOK INIT */
window.fbAsyncInit = function() {
  FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
  FB.getLoginStatus(checkLoginState);
};

function checkLoginState(response) {
  if (response && response.status === 'connected') {
    userAccessToken = response.authResponse.accessToken;
    document.getElementById("btnLoginFB").style.display = "none";
    document.getElementById("btnLogoutFB").style.display = "inline-block";
  }
}

document.getElementById("btnLoginFB").onclick = () => FB.login(checkLoginState, { scope: 'ads_read,ads_management,business_management,pages_show_list' });
document.getElementById("btnLogoutFB").onclick = () => FB.logout(() => location.reload());

/* GOOGLE INIT */
function gapiInit() {
  gapi.load("client", () => gapi.client.load("youtube", "v3"));
}

window.addEventListener("load", () => {
  gapiInit();
  ytTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    callback: (resp) => {
      ytAccessToken = resp.access_token;
      document.getElementById("btnGoogleLogin").style.display = "none";
      document.getElementById("btnGoogleLogout").style.display = "inline-block";
    }
  });
});
document.getElementById("btnGoogleLogin").onclick = () => ytTokenClient.requestAccessToken({ prompt: "consent" });
document.getElementById("btnGoogleLogout").onclick = () => location.reload();

/* ---------------------------
   FACEBOOK METRICS
--------------------------- */
document.getElementById("btnGetAdInsights").onclick = () => {
  if (!userAccessToken) return alert("Login with Facebook first.");
  FB.api('/me/adaccounts', 'GET', { access_token: userAccessToken }, res => {
    if (!res || res.error) return alert("Error fetching ad accounts.");
    selectedAdAccount = res.data[0];
    FB.api(`/${selectedAdAccount.id}/insights`, 'GET', {
      fields: 'spend,impressions,clicks',
      date_preset: 'last_7d',
      access_token: userAccessToken
    }, data => {
      if (!data || data.error) return alert("Failed to get insights.");
      const d = data.data[0];
      document.getElementById("adInsightsResult").textContent = JSON.stringify(d, null, 2);
      const metrics = { Spend: d.spend || 0, Impressions: d.impressions || 0, Clicks: d.clicks || 0 };
      if (adChart) adChart.destroy();
      adChart = new Chart(document.getElementById("adChart"), {
        type: "bar",
        data: { labels: Object.keys(metrics), datasets: [{ data: Object.values(metrics), backgroundColor: '#4267B2' }] }
      });
    });
  });
};

/* ---------------------------
   YOUTUBE UPLOAD + METRICS
--------------------------- */
document.getElementById("uploadForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!ytAccessToken) return alert("Login with Google first.");

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
};
