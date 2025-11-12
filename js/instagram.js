
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
