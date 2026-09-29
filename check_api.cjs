const http = require('http');

async function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function post(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const h = await get('http://localhost:5000/api/health');
    console.log('/api/health:', h.status, h.data);
    
    const s = await get('http://localhost:5000/api/validation/summary');
    console.log('/api/validation/summary:', s.status, s.data);

    const i = await get('http://localhost:5000/api/validation/issues');
    console.log('/api/validation/issues:', i.status, JSON.parse(i.data).length, 'issues');

    const r = await post('http://localhost:5000/api/validation/run');
    console.log('/api/validation/run:', r.status);
    console.log('Run result keys:', Object.keys(JSON.parse(r.data)));

    const i2 = await get('http://localhost:5000/api/validation/issues');
    const issues = JSON.parse(i2.data);
    console.log('/api/validation/issues after run:', i2.status, issues.length, 'issues');
    
    if (issues.length > 0) {
      const issue = issues[0];
      console.log('Sample Issue:', issue.ruleId, issue.entityType, issue.entityId, issue.status, issue.reviewStatus);
    }
  } catch (e) {
    console.error(e);
  }
}
main();
