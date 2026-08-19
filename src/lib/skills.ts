export const APPS_SKILLS = [
  {
    name: "apps-connect",
    goal: "Connect Apps-mcp and verify authentication",
  },
  {
    name: "apps-inspect-payments",
    goal: "Inspect customers and payment transactions",
  },
  {
    name: "apps-manage-payment-pages",
    goal: "Create and maintain payment pages",
  },
  {
    name: "apps-manage-registration-pages",
    goal: "Create and maintain registration pages",
  },
  {
    name: "apps-manage-coupons",
    goal: "Create and maintain discount codes",
  },
  {
    name: "apps-manage-discord",
    goal: "Manage Discord roles and channels through Apps",
  },
  {
    name: "apps-handle-webhooks",
    goal: "Build and verify Apps Webhook receivers",
  },
] as const;

export const APPS_SKILLS_INSTALL = "npx skills add jammaru/theapps-mcp";
export const APPS_SKILLS_RELEASE = "https://github.com/jammaru/theapps-mcp/releases/latest";
export const APPS_SKILLS_DESKTOP_ZIP =
  "https://github.com/jammaru/theapps-mcp/releases/latest/download/theapps-mcp-skills.zip";
