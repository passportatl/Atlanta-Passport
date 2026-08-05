# Urgent Credential Rotation

Status: launch blocker

Credentials were found in the tracked Replit configuration of a public
repository. Removing them from the latest revision does not invalidate copies
in Git history, clones, caches, or logs.

## Rotate before any deployment

1. Revoke and replace the exposed GitHub personal access token.
2. Rotate the Clerk secret key and confirm the new key matches the intended
   Clerk instance.
3. Replace the application session secret.
4. Review Google Maps key restrictions by HTTP referrer, API, and quota.
5. Review every integration credential that appeared in the tracked file.
6. Store replacements only in Replit Secrets or the approved secret manager.
7. Confirm the app builds and authenticates using the replacements.
8. Review GitHub account and repository audit logs for unexpected access.

## Repository history

After rotation, decide whether to rewrite Git history to remove the old values.
History rewriting is disruptive and does not replace credential rotation. If
performed, coordinate it separately, invalidate old clones, and force all
contributors to re-clone.

## Verification

- [ ] Old GitHub token is rejected.
- [ ] Old Clerk secret is rejected.
- [ ] Old session secret is no longer used.
- [ ] Replacement secrets are absent from tracked files.
- [ ] Secret scanning is enabled on GitHub.
- [ ] Replit preview and production use the intended secret set.
