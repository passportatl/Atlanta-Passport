const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/pages/passport/stamps.tsx', 'utf8');

code = code.replace(
  'updatePrefs.mutate({\n      visitorId,\n      data: { promoOptIn: checked }\n    }',
  'updatePrefs.mutate({\n      id: visitorId,\n      data: { promoOptIn: checked }\n    }'
);

fs.writeFileSync('artifacts/atlanta-passport/src/pages/passport/stamps.tsx', code);
