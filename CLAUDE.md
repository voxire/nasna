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

- Atomic commits — one logical unit per commit, never batch unrelated changes
- When a task touches multiple files, commit in logical order (dependencies first)
- Bug fixes discovered during a task get their own commit
