# AGENTS

## Code Formatting

All files in this repository should be formatted with Prettier using tab indentation.

- Install Prettier if necessary:
  ```sh
  npm install --no-save prettier
  ```
- Format sources before committing:
  ```sh
  npx prettier --write --use-tabs .
  ```

This project does not maintain a Prettier configuration file, so the `--use-tabs` flag is required to ensure tab-based indentation.
