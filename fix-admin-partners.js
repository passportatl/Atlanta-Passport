const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/pages/admin-partners.tsx', 'utf8');

code = code.replace(
  'import { useToast } from "@/components/ui/use-toast";',
  'import { useToast } from "@/hooks/use-toast";'
);

code = code.replace(
  'const handleUpdate = (id: string, updates: any) => {',
  'const handleUpdate = (id: string, recordType: any, updates: any) => {'
);

// We need to replace handleUpdate(record.id, {...}) with handleUpdate(record.id, record.recordType, {...})
code = code.replace(
  /handleUpdate\(record\.id, \{ assignedTo/g,
  'handleUpdate(record.id, record.recordType, { assignedTo'
);
code = code.replace(
  /handleUpdate\(record\.id, \{ lastContactAt/g,
  'handleUpdate(record.id, record.recordType, { lastContactAt'
);
code = code.replace(
  /handleUpdate\(record\.id, \{ salesStage/g,
  'handleUpdate(record.id, record.recordType, { salesStage'
);
code = code.replace(
  /handleUpdate\(record\.id, \{ paymentStatus/g,
  'handleUpdate(record.id, record.recordType, { paymentStatus'
);
code = code.replace(
  /handleUpdate\(record\.id, \{ nextFollowUpAt/g,
  'handleUpdate(record.id, record.recordType, { nextFollowUpAt'
);
code = code.replace(
  /handleUpdate\(record\.id, \{ crmNotes/g,
  'handleUpdate(record.id, record.recordType, { crmNotes'
);

code = code.replace(
  '        id,\n        data: updates,\n      },',
  '        recordType,\n        id,\n        data: updates,\n      },'
);

// Now the reminderMutation issue:
// The hook creation is:
// const reminderMutation = useRunReminderCheck();
// And mutation:
// reminderMutation.mutate(undefined, { request: { headers: { "x-admin-key": adminKey } } ...
// Since mutate doesn't accept request, we should define reminderMutation passing request to the hook:
// const reminderMutation = useRunReminderCheck({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });
// And mutate() shouldn't pass request.

code = code.replace(
  'const reminderMutation = useRunReminderCheck();',
  'const reminderMutation = useRunReminderCheck({ request: adminKey ? { headers: { "x-admin-key": adminKey } } : undefined });'
);

code = code.replace(
  '    reminderMutation.mutate(undefined, {\n      request: { headers: { "x-admin-key": adminKey } },\n      onSuccess: (res) => {',
  '    reminderMutation.mutate(undefined, {\n      onSuccess: (res) => {'
);

fs.writeFileSync('artifacts/atlanta-passport/src/pages/admin-partners.tsx', code);
