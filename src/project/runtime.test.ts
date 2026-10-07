import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "../platform/env";
import { loadRepository, resetRepositoryCache } from "./runtime";

const cwd = process.cwd();
const fixture = join(cwd, "fixtures", "fixture-demo");

afterEach(() => {
  resetRepositoryCache();
});

function seedStore(sequence: number): string {
  const root = mkdtempSync(join(tmpdir(), "souz-snapshot-"));
  const revision = join(root, "revisions", String(sequence));
  cpSync(fixture, revision, { recursive: true });
  writeFileSync(join(root, "CURRENT"), `${sequence}\n`, "utf8");
  return root;
}

describe("loadRepository", () => {
  it("serves CURRENT snapshot when DATA_MODE=snapshot", async () => {
    const storeDir = seedStore(1);
    const repo = loadRepository(
      loadEnv({
        APP_ENV: "local",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: storeDir,
      }),
      cwd,
    );
    expect(repo.hasCatalog()).toBe(true);
    const properties = await repo.listProperties();
    expect(properties.length).toBeGreaterThan(0);
  });

  it("switches to a new CURRENT without rebuild", async () => {
    const storeDir = seedStore(1);
    const first = loadRepository(
      loadEnv({
        APP_ENV: "local",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: storeDir,
      }),
      cwd,
    );
    const firstCount = (await first.listProperties()).length;
    cpSync(fixture, join(storeDir, "revisions", "2"), { recursive: true });
    writeFileSync(join(storeDir, "CURRENT"), "2\n", "utf8");
    resetRepositoryCache();
    const second = loadRepository(
      loadEnv({
        APP_ENV: "local",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: storeDir,
      }),
      cwd,
    );
    expect(second.hasCatalog()).toBe(true);
    expect((await second.listProperties()).length).toBe(firstCount);
  });

  it("returns empty degraded catalog when CURRENT is missing", async () => {
    const storeDir = mkdtempSync(join(tmpdir(), "souz-empty-"));
    const repo = loadRepository(
      loadEnv({
        APP_ENV: "local",
        DATA_MODE: "snapshot",
        SNAPSHOT_STORE_DIR: storeDir,
      }),
      cwd,
    );
    expect(repo.hasCatalog()).toBe(false);
    expect(await repo.listProperties()).toEqual([]);
  });
});
