const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/App.tsx', 'utf8');

// Imports
code = code.replace(
  'import AdminRoutes from "@/pages/admin-routes";',
  'import AdminRoutes from "@/pages/admin-routes";\nimport AdminVendors from "@/pages/admin-vendors";\nimport AdminPartners from "@/pages/admin-partners";\nimport AdminInsights from "@/pages/admin-insights";'
);

// Routes
code = code.replace(
  '  if (location === "/admin/routes") {\n    return <AdminRoutes />;\n  }',
  `  if (location === "/admin/routes") {\n    return <AdminRoutes />;\n  }\n  if (location === "/admin/vendors") {\n    return <AdminVendors />;\n  }\n  if (location === "/admin/partners") {\n    return <AdminPartners />;\n  }\n  if (location === "/admin/insights") {\n    return <AdminInsights />;\n  }`
);

fs.writeFileSync('artifacts/atlanta-passport/src/App.tsx', code);
