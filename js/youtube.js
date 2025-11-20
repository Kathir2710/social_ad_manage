
const BACKEND_URL = "https://social-ads-backend.onrender.com";

/* -------------------------------
   GOOGLE LOGIN (SERVER-HANDLED)
--------------------------------*/
document.getElementById("btnGoogleLogin").onclick = () => {
  window.location.href = BACKEND_URL + "/google/login";
};

document.getElementById("btnGoogleLogout").onclick = () => {
  alert("Logout done");
  location.reload();
};

// When user returns from Google OAuth callback
if (window.location.search.includes("google-auth-success")) {
  document.getElementById("ytStatus").textContent = "✅ Logged in";
  document.getElementById("btnGoogleLogin").style.display = "none";
  document.getElementById("btnGoogleLogout").style.display = "inline-block";
}

/* -------------------------------
   UPLOAD VIDEO (USING BACKEND TOKEN)
--------------------------------*/
document.getElementById("uploadForm").onsubmit = async (e) => {
  e.preventDefault();

  const file = document.getElementById("videoFile").files[0];
  if (!file) return alert("Choose a video first");

  const formData = new FormData();
  formData.append("video", file);
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("privacyStatus", document.getElementById("privacy").value);

  const res = await fetch(BACKEND_URL + "/upload-video", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  document.getElementById("ytUploadResult").textContent = JSON.stringify(data, null, 2);
};

/* -------------------------------
   FETCH GOOGLE ADS METRICS
--------------------------------*/
document.getElementById("btnFetchMetrics").onclick = async () => {
  const res = await fetch(BACKEND_URL + "/googleads-metrics");
  const data = await res.json();

  document.getElementById("metricsResult").textContent = JSON.stringify(data, null, 2);

  // chart data
  const rows = data.results || [];
  const labels = rows.map(r => r.campaign.name);
  const impressions = rows.map(r => Number(r.metrics.impressions));
  const clicks = rows.map(r => Number(r.metrics.clicks));

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

