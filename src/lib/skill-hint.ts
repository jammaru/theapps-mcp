import type { ToolName } from "../tools/catalog.ts";
import type { APPS_SKILLS } from "./skills.ts";

export type AppsSkillName = (typeof APPS_SKILLS)[number]["name"];
export type AppsSkillRoute = AppsSkillName | "current-goal";

/**
 * Goal-specific workflow to load before each domain MCP tool is used.
 * apps_help is intentionally the bootstrap exception: it discovers this mapping.
 */
export const APPS_TOOL_SKILLS = {
  apps_auth_status: "current-goal",
  apps_clear_token_cache: "apps-connect",
  apps_get_customer: "apps-inspect-payments",
  apps_list_charges: "apps-inspect-payments",
  apps_get_charge: "apps-inspect-payments",
  apps_list_paid_payments: "apps-inspect-payments",
  apps_get_paid_payment: "apps-inspect-payments",
  apps_list_installments_payments: "apps-inspect-payments",
  apps_get_installments_payment: "apps-inspect-payments",
  apps_verify_webhook_signature: "apps-handle-webhooks",
  apps_list_advance_plans: "apps-manage-registration-pages",
  apps_get_advance_plan: "apps-manage-registration-pages",
  apps_create_advance_plan: "apps-manage-registration-pages",
  apps_update_advance_plan: "apps-manage-registration-pages",
  apps_delete_advance_plan: "apps-manage-registration-pages",
  apps_list_advance_plan_contractors: "apps-manage-registration-pages",
  apps_list_products: "apps-manage-payment-pages",
  apps_get_product: "apps-manage-payment-pages",
  apps_create_product: "apps-manage-payment-pages",
  apps_update_product: "apps-manage-payment-pages",
  apps_delete_product: "apps-manage-payment-pages",
  apps_list_product_purchasers: "apps-manage-payment-pages",
  apps_list_paid_plans: "apps-manage-payment-pages",
  apps_get_paid_plan: "apps-manage-payment-pages",
  apps_create_paid_plan: "apps-manage-payment-pages",
  apps_update_paid_plan: "apps-manage-payment-pages",
  apps_delete_paid_plan: "apps-manage-payment-pages",
  apps_list_paid_plan_subscribers: "apps-manage-payment-pages",
  apps_list_installment_plans: "apps-manage-payment-pages",
  apps_get_installment_plan: "apps-manage-payment-pages",
  apps_create_installment_plan: "apps-manage-payment-pages",
  apps_update_installment_plan: "apps-manage-payment-pages",
  apps_delete_installment_plan: "apps-manage-payment-pages",
  apps_list_installment_plan_subscribers: "apps-manage-payment-pages",
  apps_list_coupons: "apps-manage-coupons",
  apps_get_coupon: "apps-manage-coupons",
  apps_create_coupon: "apps-manage-coupons",
  apps_update_coupon: "apps-manage-coupons",
  apps_delete_coupon: "apps-manage-coupons",
  apps_get_discord_role: "apps-manage-discord",
  apps_create_discord_role: "apps-manage-discord",
  apps_update_discord_role: "apps-manage-discord",
  apps_delete_discord_role: "apps-manage-discord",
  apps_get_discord_channel: "apps-manage-discord",
  apps_create_discord_channel: "apps-manage-discord",
  apps_update_discord_channel: "apps-manage-discord",
  apps_delete_discord_channel: "apps-manage-discord",
} as const satisfies Record<Exclude<ToolName, "apps_help">, AppsSkillRoute>;

export function toolSkillHint(toolName: Exclude<ToolName, "apps_help">): string {
  const route = APPS_TOOL_SKILLS[toolName];
  if (route === "current-goal") {
    return `Before the first ${toolName} call in a task, read the skill matching the user's goal; use apps-connect for setup or authentication troubleshooting.`;
  }
  return `Before the first ${toolName} call in a task, read the ${route} skill (SKILL.md and linked references as needed).`;
}
