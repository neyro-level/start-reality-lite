import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined ? undefined : value;

const PLACEHOLDER_SECRETS = new Set([
  "changeme",
  "change-me",
  "password",
  "secret",
  "todo",
  "placeholder",
]);

const SECRET_KEYS = [
  "SMTP_PASS",
  "LEAD_SPOOL_KEY",
  "SYNC_SIGNAL_SECRET",
] as const;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  INDEXING_MODE: z.enum(["private", "staging", "public"]).default("private"),
  DATA_MODE: z.enum(["snapshot", "local"]).default("local"),
  LEADS_ROUTE: z.enum(["direct"]).default("direct"),
  LEAD_TRANSPORT: z.enum(["none", "smtp", "webhook"]).default("none"),
  LEAD_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  PROJECT_FIXTURE: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SNAPSHOT_STORE_DIR: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  LOCAL_SNAPSHOT_DIR: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  MEDIA_ORIGIN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  ANALYTICS_METRIKA_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  SMTP_SECURE: z.preprocess(
    emptyToUndefined,
    z.enum(["true", "false"]).optional(),
  ),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  LEAD_SPOOL_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  LEAD_SPOOL_DIR: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SYNC_SIGNAL_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  PROVIDER_ORIGIN: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

export type AppEnv = Omit<z.infer<typeof envSchema>, "SMTP_SECURE"> & {
  SMTP_SECURE?: boolean;
};

function assertNoSilentSecretFallback(parsed: z.infer<typeof envSchema>): void {
  for (const key of SECRET_KEYS) {
    const value = parsed[key];
    if (value !== undefined && PLACEHOLDER_SECRETS.has(value.toLowerCase())) {
      throw new Error(`${key} must not use a silent fallback or placeholder`);
    }
  }
  if (parsed.DATA_MODE === "snapshot" && parsed.APP_ENV !== "local") {
    if (!parsed.SNAPSHOT_STORE_DIR) {
      throw new Error("SNAPSHOT_STORE_DIR is required when DATA_MODE=snapshot");
    }
    if (!parsed.SYNC_SIGNAL_SECRET) {
      throw new Error("SYNC_SIGNAL_SECRET is required when DATA_MODE=snapshot");
    }
  }
  if (parsed.DATA_MODE === "local" && parsed.APP_ENV !== "local") {
    if (!parsed.LOCAL_SNAPSHOT_DIR) {
      throw new Error("LOCAL_SNAPSHOT_DIR is required when DATA_MODE=local");
    }
  }
  if (parsed.APP_ENV !== "local") {
    if (!parsed.LEAD_SPOOL_DIR) {
      throw new Error("LEAD_SPOOL_DIR is required when APP_ENV is not local");
    }
    if (!parsed.LEAD_SPOOL_KEY) {
      throw new Error("LEAD_SPOOL_KEY is required when APP_ENV is not local");
    }
    assertLeadSpoolKey(parsed.LEAD_SPOOL_KEY);
  } else if (parsed.LEAD_SPOOL_KEY) {
    assertLeadSpoolKey(parsed.LEAD_SPOOL_KEY);
  }
  if (parsed.LEAD_TRANSPORT === "smtp") {
    const required = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_SECURE",
      "SMTP_USER",
      "SMTP_PASS",
      "SMTP_FROM",
    ] as const;
    for (const key of required) {
      if (parsed[key] === undefined) {
        throw new Error(`${key} is required when LEAD_TRANSPORT=smtp`);
      }
    }
  }
  if (parsed.LEAD_TRANSPORT === "webhook" && !parsed.LEAD_WEBHOOK_URL) {
    throw new Error("LEAD_WEBHOOK_URL is required when LEAD_TRANSPORT=webhook");
  }
  if (parsed.APP_ENV !== "local" && parsed.LEAD_TRANSPORT === "none") {
    throw new Error(
      "LEAD_TRANSPORT=none is only allowed in local/dev; staging/production forms require smtp or webhook",
    );
  }
}

export function assertLeadSpoolKey(raw: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("LEAD_SPOOL_KEY must be 32 bytes of base64");
  }
  return key;
}

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): AppEnv {
  const parsed = envSchema.parse(source);
  assertNoSilentSecretFallback(parsed);
  return {
    ...parsed,
    SMTP_SECURE:
      parsed.SMTP_SECURE === undefined
        ? undefined
        : parsed.SMTP_SECURE === "true",
  };
}

export const env = loadEnv();
