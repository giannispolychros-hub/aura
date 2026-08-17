const fs = require('fs');
const parser = require('@babel/parser');

const src = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();

try {
  parser.parse(src, {
    sourceType: 'module',
    plugins: ['jsx'],
    errorRecovery: false,
  });
  console.log('✓ ΟΡΙΣΤΙΚΑ ΣΩΣΤΟ — πλήρες, έγκυρο JSX/JS συντακτικό δέντρο, μηδενική αμφιβολία');
  process.exit(0);
} catch (e) {
  console.log('✗ ΣΦΑΛΜΑ ΣΥΝΤΑΞΗΣ:', e.message);
  process.exit(1);
}
