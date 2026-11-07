export const ROLES = ["owner", "admin", "office", "sales", "engineer", "accountant"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  office: "Office",
  sales: "Sales",
  engineer: "Engineer",
  accountant: "Accountant",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Everything, including billing and deleting the company",
  admin: "Everything, including users, settings and integrations",
  office: "Customers, deals, quotes, invoices, booking jobs and payments",
  sales: "Leads, deals and quotes",
  engineer: "Only their own jobs: view, add photos and notes, mark complete",
  accountant: "Invoices, payments and expenses, and exports",
};

export const canManageCompany = (role: Role | null | undefined) => role === "owner" || role === "admin";
