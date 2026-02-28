# Codex Session Preferences

## Git Command Policy

- Use plain `git` commands only.
- Do not wrap git in `bash -lc` or other shell wrappers.
- Do not use pipes, `&&`, or chained git commands.
- Prefer direct single-command calls such as:
  - `git add ...`
  - `git commit ...`
  - `git push ...`
  - `git checkout ...`
  - `git status`
  - `git diff`
  - `git log`
