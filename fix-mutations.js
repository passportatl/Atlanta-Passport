const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Change useUpdateCrmRecord() to useUpdateCrmRecord({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined })
  code = code.replace(
    'const updateMutation = useUpdateCrmRecord();',
    'const updateMutation = useUpdateCrmRecord({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });'
  );

  // Remove request from updateMutation.mutate
  code = code.replace(
    /        request: \{ headers: \{ "x-admin-key": adminKey \} \},\n/g,
    ''
  );

  fs.writeFileSync(file, code);
}

fixFile('artifacts/atlanta-passport/src/pages/admin-partners.tsx');
fixFile('artifacts/atlanta-passport/src/pages/admin-vendors.tsx');
