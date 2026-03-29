require('dotenv').config()

async function testApi() {
  try {
    const host = process.env.RAPIDAPI_HOST || 'real-time-image-search.p.rapidapi.com';
    const key = process.env.RAPIDAPI_KEY;
    const query = 'Amoxicillin';
    const url = `https://${host}/search?query=${encodeURIComponent(query + ' medicine box product')}&limit=10`;

    console.log('Fetching:', url);
    const fetchRes = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key
      }
    });

    if (!fetchRes.ok) {
      console.error('Error status:', fetchRes.status);
      console.error(await fetchRes.text());
      return;
    }

    const json = await fetchRes.json();
    console.log('Raw JSON preview:');
    console.dir(json, { depth: 3 });
  } catch(e) {
    console.error('Crash:', e);
  }
}

testApi();
