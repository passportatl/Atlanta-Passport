const fs = require('fs');
let code = fs.readFileSync('artifacts/atlanta-passport/src/pages/passport/stamps.tsx', 'utf8');

const importsToAdd = `import { useUpdateVisitorPreferences, getGetVisitorQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Mail } from "lucide-react";
`;

code = code.replace(
  'import { ArrowUpRight } from "lucide-react";',
  'import { ArrowUpRight, Mail } from "lucide-react";\nimport { useUpdateVisitorPreferences, getGetVisitorQueryKey } from "@workspace/api-client-react";\nimport { useQueryClient } from "@tanstack/react-query";\nimport { Switch } from "@/components/ui/switch";'
);

const hooksToAdd = `
  const { visitorId, visitor } = useVisitor();
  const queryClient = useQueryClient();
  const updatePrefs = useUpdateVisitorPreferences();

  const handlePromoToggle = (checked: boolean) => {
    if (!visitorId) return;
    
    queryClient.setQueryData(getGetVisitorQueryKey(visitorId), (old: any) => 
      old ? { ...old, promoOptIn: checked } : old
    );

    updatePrefs.mutate({
      visitorId,
      data: { promoOptIn: checked }
    }, {
      onError: () => {
        // Rollback on error
        queryClient.invalidateQueries({ queryKey: getGetVisitorQueryKey(visitorId) });
      }
    });
  };
`;

code = code.replace(
  'const { visitorId } = useVisitor();',
  hooksToAdd
);

const uiToAdd = `
      {visitorId && visitor && (
        <div className="card-pop bg-[hsl(var(--brand-yellow))] p-4 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground text-brand-yellow flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground leading-tight">Email me about prizes & partner offers</h3>
              <p className="text-xs text-foreground/80 mt-1">Get updates on new rewards and local deals. You can change this anytime.</p>
            </div>
          </div>
          <Switch 
            checked={visitor.promoOptIn} 
            onCheckedChange={handlePromoToggle}
            className="data-[state=checked]:bg-foreground data-[state=unchecked]:bg-foreground/20 border-2 border-foreground shadow-pop-sm shrink-0"
          />
        </div>
      )}
`;

code = code.replace(
  '<PrizeLadder collected={collected} redeemedTiers={redeemedTiers} compact />',
  '<PrizeLadder collected={collected} redeemedTiers={redeemedTiers} compact />\n\n' + uiToAdd
);

fs.writeFileSync('artifacts/atlanta-passport/src/pages/passport/stamps.tsx', code);
