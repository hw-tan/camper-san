# /ship — Commit, push, and open a PR

Commit all staged/unstaged changes, push to the active feature branch, and create a GitHub PR into master.

## Usage
```
/ship "your commit message"
```
If no message is provided, draft one from the diff.

## Steps to follow

1. **Check state**
   - Run `git status` and `git diff` to understand what changed
   - If nothing changed, say so and stop

2. **Stage and commit**
   - Stage relevant changed files by name (avoid `git add -A` in case of sensitive files)
   - Commit with the provided message (or a drafted one)
   - Always append the session URL to the commit message

3. **Push**
   - Push to `claude/vercel-repo-editing-TV5cv` (the active dev branch):
     ```
     git push -u origin claude/vercel-repo-editing-TV5cv
     ```
   - If push is rejected due to divergence, use `--force-with-lease` (safe on this branch)
   - Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors

4. **Open PR**
   - Create a PR from `claude/vercel-repo-editing-TV5cv` → `master` using the GitHub MCP tool
   - Title: concise, under 70 characters
   - Body: short bullet summary + test checklist + session URL
   - Return the PR URL to the user

## Context
- Repo: `hw-tan/camper-san`
- Active dev branch: `claude/vercel-repo-editing-TV5cv`
- Vercel auto-deploys master; PRs get preview deployments
- After a squash-merge the branch history diverges — if push fails for history reasons, create a fresh branch from master, cherry-pick the new commits, push that, and open the PR from the new branch
