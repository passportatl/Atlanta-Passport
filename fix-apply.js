const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/pages/apply.tsx', 'utf8');

code = code.replace(
  'form.setValue("package", ""); // reset package when type changes',
  'form.setValue("package", undefined); // reset package when type changes'
);

fs.writeFileSync('artifacts/atlanta-passport/src/pages/apply.tsx', code);
