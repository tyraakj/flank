import { Prisma } from "@flank/database";

export interface CanonicalTaxonomyDefinition {
  canonicalName: string;
  slug: string;
  category: string;
  description: string;
  aliases: string[];
}

export const STANDARD_FEATURE_TAXONOMY: CanonicalTaxonomyDefinition[] = [
  // Security & Access
  {
    canonicalName: "Single Sign-On (SSO)",
    slug: "single-sign-on-sso",
    category: "Security & Access",
    description:
      "Enterprise identity provider authentication via SAML 2.0, OIDC, Okta, Azure AD, or Google Workspace.",
    aliases: [
      "sso",
      "saml",
      "saml login",
      "saml sso",
      "saml 2.0",
      "single sign-on",
      "single sign on",
      "okta integration",
      "azure ad sso",
      "google sso",
      "enterprise sso",
      "oidc",
    ],
  },
  {
    canonicalName: "Multi-Factor Authentication (MFA)",
    slug: "multi-factor-authentication-mfa",
    category: "Security & Access",
    description:
      "Secondary authentication mechanism using TOTP authenticator apps, SMS codes, or hardware security keys.",
    aliases: [
      "mfa",
      "2fa",
      "two-factor authentication",
      "two factor authentication",
      "multi-factor auth",
      "totp",
      "authenticator app",
      "sms verification",
    ],
  },
  {
    canonicalName: "Role-Based Access Control (RBAC)",
    slug: "role-based-access-control-rbac",
    category: "Security & Access",
    description:
      "Granular user permission management assigning specific permissions and access boundaries based on roles.",
    aliases: [
      "rbac",
      "user permissions",
      "roles and permissions",
      "custom roles",
      "granular permissions",
      "role based access control",
      "member roles",
      "admin controls",
    ],
  },
  {
    canonicalName: "Audit Logs",
    slug: "audit-logs",
    category: "Security & Access",
    description:
      "Comprehensive immutable event history of user actions, administrative changes, and security events for compliance.",
    aliases: [
      "audit trail",
      "activity log",
      "audit logging",
      "event logs",
      "compliance logs",
      "security audit log",
      "system activity trail",
    ],
  },
  {
    canonicalName: "SOC 2 & Compliance Certifications",
    slug: "soc-2-compliance-certifications",
    category: "Security & Access",
    description:
      "Verified organizational security compliance standards including SOC 2 Type II, ISO 27001, HIPAA, or GDPR.",
    aliases: [
      "soc 2",
      "soc2",
      "soc 2 type ii",
      "soc 2 certified",
      "iso 27001",
      "hipaa",
      "hipaa compliance",
      "gdpr",
      "gdpr compliant",
      "pci dss",
    ],
  },
  {
    canonicalName: "Data Encryption & Custom KMS",
    slug: "data-encryption-custom-kms",
    category: "Security & Access",
    description:
      "AES-256 data encryption at rest and TLS in transit, with optional Bring Your Own Key (BYOK) custom key management.",
    aliases: [
      "encryption at rest",
      "tls encryption",
      "byok",
      "bring your own key",
      "custom kms",
      "data residency",
      "e2ee",
      "end-to-end encryption",
    ],
  },

  // Integrations & Developer Platform
  {
    canonicalName: "REST API Access",
    slug: "rest-api-access",
    category: "Integrations & API",
    description:
      "Programmatic REST API for managing resources, automating workflows, and syncing data with external systems.",
    aliases: [
      "api access",
      "rest api",
      "public api",
      "developer api",
      "restful api",
      "graphql api",
      "api keys",
      "api rate limits",
    ],
  },
  {
    canonicalName: "Webhooks",
    slug: "webhooks",
    category: "Integrations & API",
    description:
      "Real-time HTTP event notification callbacks triggered on state changes and system mutations.",
    aliases: [
      "webhook notifications",
      "real-time webhooks",
      "event webhooks",
      "outgoing webhooks",
      "inbound webhooks",
      "custom webhooks",
    ],
  },
  {
    canonicalName: "Third-Party App Integrations",
    slug: "third-party-app-integrations",
    category: "Integrations & API",
    description:
      "Pre-built connectors to external SaaS tools (Slack, Jira, GitHub, Notion, Salesforce, Zapier).",
    aliases: [
      "zapier integration",
      "app marketplace",
      "integrations directory",
      "slack integration",
      "jira integration",
      "github integration",
      "native integrations",
      "connectors",
    ],
  },
  {
    canonicalName: "Developer SDKs & CLI",
    slug: "developer-sdks-cli",
    category: "Integrations & API",
    description:
      "Official software development kits across major programming languages and command-line interfaces.",
    aliases: [
      "cli tool",
      "developer cli",
      "client libraries",
      "python sdk",
      "node sdk",
      "typescript sdk",
      "go sdk",
      "command-line client",
    ],
  },

  // Analytics & Reporting
  {
    canonicalName: "Custom Dashboards & Visualizations",
    slug: "custom-dashboards-visualizations",
    category: "Analytics & Reporting",
    description:
      "Configurable analytics dashboards, chart widgets, and real-time visualization canvas.",
    aliases: [
      "custom dashboards",
      "analytics dashboard",
      "reporting dashboard",
      "dashboard builder",
      "data visualization",
      "custom widgets",
      "charts and graphs",
    ],
  },
  {
    canonicalName: "Export & Data Portability",
    slug: "export-data-portability",
    category: "Analytics & Reporting",
    description:
      "Structured file download formats including CSV, JSON, PDF, and Excel for reports and raw data records.",
    aliases: [
      "csv export",
      "pdf export",
      "excel export",
      "data export",
      "raw data download",
      "json export",
      "bulk data export",
    ],
  },
  {
    canonicalName: "Automated Scheduled Reports",
    slug: "automated-scheduled-reports",
    category: "Analytics & Reporting",
    description:
      "Recurring summary digests and scheduled email/Slack notifications on daily, weekly, or monthly cadences.",
    aliases: [
      "scheduled reports",
      "email reports",
      "recurring digests",
      "automated digests",
      "scheduled delivery",
    ],
  },

  // Collaboration & Team Workspaces
  {
    canonicalName: "Team Workspaces & Multi-Tenancy",
    slug: "team-workspaces-multi-tenancy",
    category: "Collaboration & Workflow",
    description:
      "Isolated organizational environments with member seat management and shared project resources.",
    aliases: [
      "workspaces",
      "team workspaces",
      "multi-user workspaces",
      "organization accounts",
      "shared spaces",
      "team collaboration",
    ],
  },
  {
    canonicalName: "Comments & Real-time Collaboration",
    slug: "comments-real-time-collaboration",
    category: "Collaboration & Workflow",
    description:
      "In-line contextual commenting, @mentions, presence indicators, and live multiplayer editing.",
    aliases: [
      "collaborative comments",
      "@mentions",
      "thread discussions",
      "real-time collaboration",
      "multiplayer editing",
      "in-app comments",
    ],
  },
  {
    canonicalName: "Version History & Rollbacks",
    slug: "version-history-rollbacks",
    category: "Collaboration & Workflow",
    description:
      "Point-in-time snapshot history, diff comparisons, and one-click rollback capabilities.",
    aliases: [
      "version history",
      "revision history",
      "versioning",
      "rollback",
      "audit history",
      "restore previous version",
    ],
  },

  // Customization & White-labeling
  {
    canonicalName: "Custom Domain & SSL",
    slug: "custom-domain-ssl",
    category: "Customization & Branding",
    description:
      "Host applications or public portals under a custom CNAME domain with automated TLS/SSL provisioning.",
    aliases: ["custom domain", "cname support", "custom ssl", "custom subdomain", "custom urls"],
  },
  {
    canonicalName: "White-Labeling & Custom Branding",
    slug: "white-labeling-custom-branding",
    category: "Customization & Branding",
    description:
      "Remove vendor watermarks and customize logos, brand colors, email templates, and themes.",
    aliases: [
      "white label",
      "white-labeling",
      "custom branding",
      "remove watermark",
      "custom logo",
      "brand customization",
      "custom styling",
    ],
  },
  {
    canonicalName: "Dark Mode & Theme Customization",
    slug: "dark-mode-theme-customization",
    category: "Customization & Branding",
    description: "User-selectable light/dark visual themes and interface styling preferences.",
    aliases: [
      "dark mode",
      "dark theme",
      "theme switcher",
      "light/dark mode",
      "theme customization",
    ],
  },
];

export class FeatureTaxonomyService {
  private static aliasMap: Map<string, CanonicalTaxonomyDefinition> = new Map();

  static {
    // Build fast lookup index from standard definitions
    for (const def of STANDARD_FEATURE_TAXONOMY) {
      this.aliasMap.set(this.normalizeText(def.canonicalName), def);
      for (const alias of def.aliases) {
        this.aliasMap.set(this.normalizeText(alias), def);
      }
    }
  }

  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\-_/]+/g, " ")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ");
  }

  static toSlug(text: string): string {
    const clean = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return clean || "feature";
  }

  /**
   * Resolves an arbitrary extracted feature label into a canonical taxonomy entry.
   * If a match is found in the dictionary or aliases, returns the standardized canonical node.
   * Otherwise, generates a clean normalized canonical name and slug.
   */
  static resolveCanonicalFeature(
    label: string,
    categoryHint?: string,
  ): {
    canonicalName: string;
    slug: string;
    category: string;
    description?: string;
    matchedExisting: boolean;
  } {
    const normalized = this.normalizeText(label);

    // 1. Exact or Alias match in standard taxonomy
    if (this.aliasMap.has(normalized)) {
      const matched = this.aliasMap.get(normalized)!;
      return {
        canonicalName: matched.canonicalName,
        slug: matched.slug,
        category: matched.category,
        description: matched.description,
        matchedExisting: true,
      };
    }

    // 2. Partial substring matching against standard taxonomy aliases
    for (const [alias, def] of this.aliasMap.entries()) {
      if (
        alias.length >= 4 &&
        (normalized === alias || normalized.includes(alias) || alias.includes(normalized))
      ) {
        return {
          canonicalName: def.canonicalName,
          slug: def.slug,
          category: def.category,
          description: def.description,
          matchedExisting: true,
        };
      }
    }

    // 3. New canonical feature creation (clean capitalization + slug)
    const titleCased = label
      .trim()
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.substring(1) : ""))
      .join(" ");

    return {
      canonicalName: titleCased,
      slug: this.toSlug(label),
      category: categoryHint || "General Capabilities",
      matchedExisting: false,
    };
  }

  /**
   * Upserts a feature node in Postgres transactionally, ensuring unique slugs.
   */
  static async upsertFeatureNode(
    tx: Prisma.TransactionClient,
    canonicalName: string,
    slug: string,
    category?: string,
    description?: string,
  ): Promise<{ id: string; slug: string; name: string }> {
    const existing = await tx.feature.findUnique({
      where: { slug },
    });

    if (existing) {
      return existing;
    }

    return await tx.feature.create({
      data: {
        name: canonicalName,
        slug,
        category: category || "General",
        description: description || null,
      },
    });
  }
}
