# CLAUDE.md

## Commit Messages

- Short imperative, no conventional prefixes (`feat:`, `fix:`, `chore:`, etc.)
- No `Co-Authored-By` trailers
- Examples:
  ```
  Add login page
  Fix border color in dark mode
  Update en locale with new keys
  ```

## Commit Style

- Atomic commits — one commit per file or logical unit, never batch unrelated changes
- Split commits in logical dependency order: types → API → hook → component → test → i18n (EN) → i18n (AR)
- Bug fixes discovered during a task get their own commit, never bundled with the feature
- Never commit `.md` files — documentation and notes stay out of version control
- Exception: `CLAUDE.md` itself is the only `.md` file that may be committed
- Exception: all `.md` files under `testing tasks/` may be committed so teammates can access them
