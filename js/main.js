console.log("Dashboard loaded");

// Load GAPI client
window.addEventListener("load", () => {
  if (typeof gapiInit === "function") gapiInit();
});
