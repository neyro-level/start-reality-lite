import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "./env";
import { loadEnv } from "./env";
import { submitLead } from "./leads/handler";
import { WindowRateLimiter } from "./leads/sink";
import { FileLeadSpool, flushLeadSpool } from "./leads/spool";
import {
  runWorkerPass,
  shouldFlushLeads,
  shouldRunSnapshotJobs,
} from "./runtime-worker";

const spoolKey = Buffer.alloc(32, 7).toString("base64");

function envWith(overrides: Record<string, string>): AppEnv {
  return loadEnv({
    APP_ENV: "local",
    LEAD_TRANSPORT: "webhook",
    LEAD_WEBHOOK_URL: "https://example.test/leads",
    LEAD_SPOOL_KEY: spoolKey,
    LEAD_SPOOL_DIR: mkdtempSync(join(tmpdir(), "sz-worker-leads-")),
    ...overrides,
  });
}

describe("runtime worker", () => {
  it("delivers a pending lead when DATA_MODE=local", async () => {
    const env = envWith({ DATA_MODE: "local" });
    expect(shouldRunSnapshotJobs(env)).toBe(false);
    expect(shouldFlushLeads(env)).toBe(true);
    const spool = new FileLeadSpool(
      env.LEAD_SPOOL_DIR as string,
      Buffer.alloc(32, 7),
    );
    await submitLead(
      {
        name: "Local",
        phone: "+78000000000",
        consent: true,
        pageKey: "contacts",
      },
      {
        ip: "127.0.0.1",
        now: new Date("2026-10-07T12:00:00.000Z"),
        destinationEmail: "office@example.test",
        mode: "direct",
        transport: "webhook",
        sink: {
          async deliver() {
            throw new Error("webhook down");
          },
        },
        limiter: new WindowRateLimiter(8, 60_000),
        spool,
      },
    );
    expect(spool.pendingCount()).toBe(1);
    let delivered = 0;
    const result = await runWorkerPass({
      cwd: process.cwd(),
      env,
      reservedRoots: [],
      snapshotDue: true,
      flushLeads: async () => {
        delivered += await flushLeadSpool(spool, {
          async deliver() {
            /* delivered */
          },
        });
      },
      syncSnapshot: async () => {
        throw new Error("snapshot must not run in local mode");
      },
    });
    expect(result.leads).toBe("ok");
    expect(result.snapshot).toBe("skipped");
    expect(delivered).toBe(1);
    expect(spool.pendingCount()).toBe(0);
  });

  it("runs leads and snapshot jobs when DATA_MODE=snapshot", async () => {
    const env = envWith({
      DATA_MODE: "snapshot",
      SNAPSHOT_STORE_DIR: mkdtempSync(join(tmpdir(), "sz-worker-store-")),
    });
    expect(shouldRunSnapshotJobs(env)).toBe(true);
    const calls: string[] = [];
    const isolated = await runWorkerPass({
      cwd: process.cwd(),
      env,
      reservedRoots: [],
      snapshotDue: true,
      flushLeads: async () => {
        calls.push("leads");
        throw new Error("smtp down");
      },
      syncSnapshot: async () => {
        calls.push("snapshot");
      },
    });
    expect(isolated.leads).toBe("error");
    expect(isolated.snapshot).toBe("ok");
    const providerFails = await runWorkerPass({
      cwd: process.cwd(),
      env,
      reservedRoots: [],
      snapshotDue: true,
      flushLeads: async () => {
        calls.push("leads");
      },
      syncSnapshot: async () => {
        calls.push("snapshot");
        throw new Error("provider down");
      },
    });
    expect(providerFails.leads).toBe("ok");
    expect(providerFails.snapshot).toBe("error");
    expect(calls).toEqual(["leads", "snapshot", "leads", "snapshot"]);
  });
});
