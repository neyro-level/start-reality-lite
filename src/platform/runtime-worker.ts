import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { AppEnv } from "./env";
import {
  createLeadTransportSink,
  flushLeadSpool,
  processLeadSpool,
} from "./leads";
import {
  consumeSyncSignal,
  createHubAdapter,
  downloadProviderSnapshot,
  flushPendingAcks,
  loadTrustSetFromFile,
  openSnapshotStore,
  runProviderSync,
} from "./snapshot";

export function shouldFlushLeads(env: AppEnv): boolean {
  return env.LEAD_TRANSPORT === "smtp" || env.LEAD_TRANSPORT === "webhook";
}

export function shouldRunSnapshotJobs(env: AppEnv): boolean {
  return env.DATA_MODE === "snapshot";
}

function resolveTrustFile(
  cwd: string,
  fixture: string,
  storeDir: string,
): string {
  const candidates = [
    process.env.SNAPSHOT_TRUST_FILE,
    join(storeDir, "trust.json"),
    join(cwd, "fixtures", fixture, "trust.json"),
  ].filter((value): value is string => Boolean(value));
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new Error("snapshot trust file is required");
  }
  return found;
}

export async function flushLeadsIfConfigured(env: AppEnv): Promise<void> {
  if (!shouldFlushLeads(env)) {
    return;
  }
  if (!env.LEAD_SPOOL_KEY || !env.LEAD_SPOOL_DIR) {
    return;
  }
  const sink = createLeadTransportSink(env);
  if (!sink) {
    return;
  }
  await flushLeadSpool(processLeadSpool(env), sink);
}

export async function runSnapshotJobs(input: {
  cwd: string;
  env: AppEnv;
  reservedRoots: readonly string[];
}): Promise<void> {
  const { cwd, env, reservedRoots } = input;
  if (!shouldRunSnapshotJobs(env)) {
    return;
  }
  if (!env.SNAPSHOT_STORE_DIR) {
    throw new Error("SNAPSHOT_STORE_DIR is required when DATA_MODE=snapshot");
  }
  const fixture = env.PROJECT_FIXTURE ?? "fixture-sz-rostov";
  const store = openSnapshotStore(env.SNAPSHOT_STORE_DIR);
  const trust = loadTrustSetFromFile(
    resolveTrustFile(cwd, fixture, env.SNAPSHOT_STORE_DIR),
  );
  let providerDir: string | null = null;
  try {
    if (env.PROVIDER_ORIGIN) {
      providerDir = mkdtempSync(join(tmpdir(), "sz-http-"));
      await downloadProviderSnapshot(
        env.PROVIDER_ORIGIN,
        providerDir,
        (path, bytes) => {
          mkdirSync(dirname(path), { recursive: true });
          writeFileSync(path, bytes);
        },
        join,
      );
    }
    const originDir =
      providerDir ?? process.env.PROVIDER_DIR ?? join(cwd, "fixtures", fixture);
    const provider = createHubAdapter(originDir);
    runProviderSync({
      storeRoot: env.SNAPSHOT_STORE_DIR,
      provider,
      trust,
      expectedProjectId: fixture,
      reservedRoots: [...reservedRoots],
    });
    flushPendingAcks(env.SNAPSHOT_STORE_DIR, provider);
  } finally {
    if (providerDir) {
      rmSync(providerDir, { recursive: true, force: true });
    }
  }
  consumeSyncSignal(store);
}

export async function runWorkerPass(input: {
  cwd: string;
  env: AppEnv;
  reservedRoots: readonly string[];
  now?: number;
  lastSnapshotPoll?: number;
  snapshotPollMs?: number;
  snapshotDue?: boolean;
  flushLeads?: (env: AppEnv) => Promise<void>;
  syncSnapshot?: () => Promise<void>;
}): Promise<{
  leads: "ok" | "skipped" | "error";
  snapshot: "ok" | "skipped" | "error";
}> {
  const result: {
    leads: "ok" | "skipped" | "error";
    snapshot: "ok" | "skipped" | "error";
  } = {
    leads: "skipped",
    snapshot: "skipped",
  };
  try {
    if (shouldFlushLeads(input.env)) {
      await (input.flushLeads ?? flushLeadsIfConfigured)(input.env);
      result.leads = "ok";
    }
  } catch (error) {
    result.leads = "error";
    const reason = error instanceof Error ? error.message : "lead retry failed";
    console.error(reason);
  }

  const snapshotDue =
    input.snapshotDue ??
    (shouldRunSnapshotJobs(input.env) &&
      (input.lastSnapshotPoll === undefined ||
        (input.now ?? Date.now()) - input.lastSnapshotPoll >=
          (input.snapshotPollMs ?? 15_000)));
  if (!shouldRunSnapshotJobs(input.env) || !snapshotDue) {
    return result;
  }
  try {
    await (
      input.syncSnapshot ??
      (() =>
        runSnapshotJobs({
          cwd: input.cwd,
          env: input.env,
          reservedRoots: input.reservedRoots,
        }))
    )();
    result.snapshot = "ok";
  } catch (error) {
    result.snapshot = "error";
    const reason =
      error instanceof Error ? error.message : "snapshot sync failed";
    console.error(reason);
  }
  return result;
}
