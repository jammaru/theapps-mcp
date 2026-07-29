import type { AppsConfig } from "../config.ts";

export type WriteArgs = {
  confirm?: boolean;
  dry_run?: boolean;
};

export function guardWrite(
  config: AppsConfig,
  args: WriteArgs,
  action: string,
): { blocked: true; message: string } | { blocked: false; dryRun: boolean } {
  if (!config.allowWrite) {
    return {
      blocked: true,
      message:
        `Write blocked: "${action}". Set APPS_MCP_ALLOW_WRITE=true to enable create/update/delete tools. ` +
        "This API talks to production (no sandbox).",
    };
  }

  if (args.dry_run) {
    return { blocked: false, dryRun: true };
  }

  if (args.confirm !== true) {
    return {
      blocked: true,
      message:
        `Write blocked: "${action}" requires confirm=true (and optionally dry_run=true first). ` +
        "Production data may be created, changed, or deleted.",
    };
  }

  return { blocked: false, dryRun: false };
}

export const writeHints = {
  readOnlyHint: false as const,
  destructiveHint: false as const,
  idempotentHint: false as const,
  openWorldHint: true as const,
};

export const destructiveHints = {
  readOnlyHint: false as const,
  destructiveHint: true as const,
  idempotentHint: false as const,
  openWorldHint: true as const,
};

export const readHints = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
  openWorldHint: true as const,
};
