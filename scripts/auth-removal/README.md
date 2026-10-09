# Authentication removal assets

This directory describes the authentication feature boundary for `scripts/remove-auth.mjs`.

## Layout

- `manifest.json` declares shared files to transform, auth-neutral files to relocate, pre-auth files to restore, and auth-owned files or trees to remove.
- `versions/authenticated` stores the known authenticated side of each transform and snapshots of auth-owned source files.
- `versions/without-auth` stores the desired no-auth side of each transform and the files that authentication originally removed.

The uninstaller uses `git merge-file` with the current workspace as one side, the authenticated version as the merge base, and the without-auth version as the other side. This removes the known authentication delta while retaining compatible edits made later. It does not replace shared files blindly.

Relocations move auth-neutral files whose route changes when the protected route group is removed. Their current contents are preserved exactly, so later component edits do not require refreshing stored versions.

Auth-owned files are intentionally stricter: their path set and contents must still match the authenticated snapshots. An unexpected or modified source file stops the preflight so removal cannot silently discard new authentication work.

## Maintenance

When authentication changes:

1. Update the authenticated version for every affected shared or auth-owned file.
2. Update the corresponding without-auth version when the desired post-removal integration changes.
3. Add, remove, or move manifest entries so every auth-owned path is represented.
4. Run `npm run auth:remove` from a clean tree.
5. Test `--apply` in a disposable clone with no later changes.
6. Test again after a committed, non-overlapping change and confirm that change survives.
7. Confirm an overlapping integration edit and a modified auth-owned file both fail during dry-run without changing the tree.

The normal apply path runs `npm install` after package manifests are transformed so `package-lock.json` and workspace links are regenerated rather than replaced from a stale snapshot. npm can retain a deleted workspace as an `extraneous` lockfile entry, so `lockfileEntries` declares the exact obsolete keys to remove afterward.

Database state is outside this workflow. Removing an applied authentication schema requires a separately reviewed migration.
