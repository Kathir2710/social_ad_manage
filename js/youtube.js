
const BACKEND_URL = "https://social-ads-backend.onrender.com";

// LOGIN BUTTON
document.getElementById("btnGoogleLogin").onclick = () => {
  window.location.href = `${BACKEND_URL}/google/login`;
};

// Upload video
document.getElementById("uploadForm").onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("video", document.getElementById("videoFile").files[0]);
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("privacyStatus", document.getElementById("privacy").value);

  const res = await fetch(`${BACKEND_URL}/upload-video`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  document.getElementById("ytUploadResult").textContent = JSON.stringify(data, null, 2);
};

// Fetch Google Ads metrics
document.getElementById("btnFetchMetrics").onclick = async () => {
  const res = await fetch(`${BACKEND_URL}/googleads-metrics`);
  const data = await res.json();
  document.getElementById("metricsResult").textContent = JSON.stringify(data, null, 2);

  const labels = data.results?.map(r => r.campaign.name) || [];
  const impressions = data.results?.map(r => r.metrics.impressions) || [];
  const clicks = data.results?.map(r => r.metrics.clicks) || [];

  new Chart(document.getElementById("ytChart"), {
    type: "bar",
    data: { labels, datasets: [
      { label: "Impressions", data: impressions },
      { label: "Clicks", data: clicks },
    ]},
  });
};
