/** End-user skill name installed via `npx skills add jammaru/theapps-mcp`. */
export const APPS_SKILL_NAME = "apps-api";

/**
 * Appended to every apps_* tool description.
 * Agents often skip soft hints — keep this imperative and tied to MCP use.
 */
export const APPS_SKILL_HINT = `Before calling any apps_* tool, read the ${APPS_SKILL_NAME} skill first (SKILL.md, then recipes/ and references/ as needed). Prefer dry_run before writes.`;
