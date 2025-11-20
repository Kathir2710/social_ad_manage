


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
