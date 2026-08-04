const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/pages/admin-vendors.tsx', 'utf8');

code = code.replace(
  '        id,\n        data: { [field]: value },\n      },',
  '        recordType: "vendor",\n        id,\n        data: { [field]: value },\n      },'
);

fs.writeFileSync('artifacts/atlanta-passport/src/pages/admin-vendors.tsx', code);
