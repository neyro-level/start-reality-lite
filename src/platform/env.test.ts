import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

const spoolKey = Buffer.alloc(32, 7).toString("base64");
const spoolDir = "/data/leads";

describe("loadEnv", () => {
  it("applies safe local defaults", () => {
    const parsed = loadEnv({ NODE_ENV: "test" });
    expect(parsed.APP_ENV).toBe("local");
    expect(parsed.DATA_MODE).toBe("local");
    expect(parsed.LEADS_ROUTE).toBe("direct");
    expect(parsed.INDEXING_MODE).toBe("private");
  });

  it("requires SNAPSHOT_STORE_DIR outside local when DATA_MODE=snapshot", () => {
    expect(() =>
      loadEnv({ APP_ENV: "staging", DATA_MODE: "snapshot" }),
    ).toThrow(/SNAPSHOT_STORE_DIR/);
  });

  it("requires SYNC_SIGNAL_SECRET outside local when DATA_MODE=snapshot", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "staging",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: "/data/snapshots",
        LEAD_SPOOL_KEY: spoolKey,
        LEAD_SPOOL_DIR: spoolDir,
      }),
    ).toThrow(/SYNC_SIGNAL_SECRET/);
  });

  it("requires LEAD_SPOOL_KEY and DIR outside local", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "staging",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: "/data/snapshots",
        SYNC_SIGNAL_SECRET: "sync-secret-value",
      }),
    ).toThrow(/LEAD_SPOOL/);
  });

  it("rejects a short LEAD_SPOOL_KEY", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "staging",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: "/data/snapshots",
        SYNC_SIGNAL_SECRET: "sync-secret-value",
        LEAD_SPOOL_DIR: spoolDir,
        LEAD_SPOOL_KEY: Buffer.alloc(8, 1).toString("base64"),
      }),
    ).toThrow(/32 bytes/);
  });

  it("requires LOCAL_SNAPSHOT_DIR outside local when DATA_MODE=local", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "production",
        DATA_MODE: "local",
        LEAD_SPOOL_KEY: spoolKey,
        LEAD_SPOOL_DIR: spoolDir,
      }),
    ).toThrow(/LOCAL_SNAPSHOT_DIR/);
  });

  it("allows LEAD_TRANSPORT=none only in local/dev", () => {
    expect(loadEnv({ APP_ENV: "local" }).LEAD_TRANSPORT).toBe("none");
    expect(() =>
      loadEnv({
        APP_ENV: "production",
        DATA_MODE: "local",
        LOCAL_SNAPSHOT_DIR: "/data/local",
        LEAD_SPOOL_KEY: spoolKey,
        LEAD_SPOOL_DIR: spoolDir,
        LEAD_TRANSPORT: "none",
      }),
    ).toThrow(/LEAD_TRANSPORT=none/);
  });
});
