---
name: Clerk React v6 custom OAuth (legacy hooks)
description: How to build custom social-login buttons with @clerk/react v6's signals API.
---

# Custom OAuth buttons with @clerk/react v6

`@clerk/react` v6 ships a new **signals-based** API. The default `useSignUp()` /
`useSignIn()` exported from `@clerk/react` return signal values
(`{ signUp, errors, fetchStatus }`) that do **not** have `isLoaded` or the classic
`authenticateWithRedirect` method. Typecheck errors look like:
`Property 'authenticateWithRedirect' does not exist on type 'SignUpFutureResource'`
and `Property 'isLoaded' does not exist on type 'SignUpSignalValue'`.

**Rule:** for custom social/OAuth buttons that call
`signUp.authenticateWithRedirect({ strategy, redirectUrl, redirectUrlComplete })`,
import the classic hook from the legacy entry instead:

```ts
import { useSignUp } from "@clerk/react/legacy"; // gives { isLoaded, signUp } classic resource
```

Keep `ClerkProvider`, `useUser`, `useClerk`, `SignIn`, `SignUp` etc. from the main
`@clerk/react`. Only the `useSignUp`/`useSignIn` custom-flow hooks need the legacy entry.

**Why:** the new signals API doesn't expose the classic redirect method; the legacy
entry preserves the v5-style resource. Discovered after two failed typecheck attempts.

**How to apply:** any time you build custom provider buttons (not the prebuilt
`<SignIn>`/`<SignUp>` components) on a project using `@clerk/react` v6+.

OAuth strategy strings: `oauth_google`, `oauth_apple`, `oauth_x` (X/Twitter), `oauth_facebook`.
