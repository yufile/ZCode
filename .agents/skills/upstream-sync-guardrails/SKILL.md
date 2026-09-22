---
name: upstream-sync-guardrails
description: Synchronize official ZCode core updates into the customized yuCode fork while preserving local branding, plugin, MCP, and product changes. Use when fetching, comparing, merging, rebasing, or cherry-picking from upstream.
---

# Upstream sync guardrails

Use this skill whenever the task brings code from the official ZCode repository into this customized yuCode repository. The outcome is a reviewed upstream update with local customizations intact, a verified build, and an explicit push decision.

## Non-negotiable invariants

- Treat the remote named `upstream` as the official source and verify its URL before changing history. The expected URL is `https://github.com/zai-org/ZCode.git`; `origin` is the fork used for publishing yuCode.
- Preserve every local commit and working-tree change unless the user explicitly asks to remove it. Never treat an upstream deletion as permission to delete a local customization.
- Do not synchronize a dirty worktree. First commit the work, create a recoverable branch, or stash with untracked files included; report which choice was made.
- Never use `git reset --hard`, `git clean`, broad `git restore`, or broad `git checkout` to make synchronization easy. Never overwrite the repository with `upstream/main` wholesale.
- Do not push, force-push, or rewrite the shared branch unless the user explicitly authorizes that action. Prefer a normal merge on a published branch; use `--force-with-lease` only for an explicitly approved rebase.

## Synchronization workflow

1. Inspect `git status --short --branch`, `git remote -v`, `git branch -vv`, and the latest graph. Confirm the worktree is safe before any mutation.
2. Run `git fetch upstream --prune`, then review `git log --oneline HEAD..upstream/main` and `git diff --stat HEAD..upstream/main`. Do not assume that every upstream commit is wanted.
3. Choose the smallest valid integration:
   - Bring all official core updates into the published custom branch with `git merge --no-ff --no-edit upstream/main`.
   - Bring only selected upstream work with `git cherry-pick <commit>` after reviewing each commit.
   - Use `git rebase upstream/main` only when the user explicitly prefers a linear history and accepts the required force-with-lease push.
4. For conflicts, preserve local yuCode behavior first and manually integrate the upstream core change. Do not resolve a conflict by taking an entire upstream file when that file contains local customization.
5. Re-run the relevant package tests and the repository gates before offering or performing a push. Record the upstream range, conflicts, resolutions, and validation results.

## Protected customization surfaces

The current local brand source of truth is:

- `packages/ui/src/assets/yu-code-logo.svg`
- `packages/ui/src/assets/yu-code-icon.svg`
- `packages/web/public/yu-code-icon.svg`
- `packages/desktop/src/renderer/yu-code-icon.svg`
- `specs/yucode-branding.md`

Derived PNG, ICO, and ICNS files under `public/logo/icons`, `packages/desktop/build`, `packages/ui/src/assets`, `packages/web/public`, and `packages/desktop/src/renderer` must not be replaced by an upstream version without reviewing the source SVG. If the source SVG or its consumers change, regenerate them with:

```powershell
pnpm --filter @zcode/desktop generate:brand-assets
```

Local plugin/MCP additions, their manifests, and their specs are also protected customizations. Preserve them unless the user explicitly asks to replace or remove them; an upstream commit that deletes a plugin is a conflict requiring a decision, not an automatic cleanup.

## Required verification

For a sync that changes source code, run at minimum:

```powershell
pnpm typecheck
pnpm lint
pnpm architecture:check --changed
pnpm fmt:check
git diff --check
```

Run package-specific tests or build commands for the touched areas. For branding/resource changes, validate the generated image dimensions and the desktop/Web build inputs as well. Report real warnings and failures; do not describe an unexecuted gate as passing.
