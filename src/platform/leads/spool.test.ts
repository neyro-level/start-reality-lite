import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { submitLead } from "./handler";
import { WindowRateLimiter } from "./sink";
import { FileLeadSpool, flushLeadSpool } from "./spool";

const key = Buffer.alloc(32, 11);

describe("lead spool", () => {
  it("decrypts the same key after a process restart", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sz-lead-key-"));
    const first = new FileLeadSpool(dir, key);
    const limiter = new WindowRateLimiter(8, 60_000);
    let fail = true;
    await submitLead(
      {
        name: "Stable",
        phone: "+78000000000",
        consent: true,
        pageKey: "contacts",
      },
      {
        ip: "stable-ip",
        now: new Date("2026-10-07T12:00:00.000Z"),
        destinationEmail: "office@example.test",
        mode: "direct",
        transport: "smtp",
        sink: {
          async deliver() {
            if (fail) {
              throw new Error("smtp down");
            }
          },
        },
        limiter,
        spool: first,
      },
    );
    expect(first.pendingCount()).toBe(1);
    const restarted = new FileLeadSpool(dir, key);
    const pending = restarted.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.delivery.phone).toBe("+78000000000");
    fail = false;
    const delivered = await flushLeadSpool(
      restarted,
      {
        async deliver() {
          /* delivered */
        },
      },
      new Date("2026-10-07T12:05:00.000Z"),
    );
    expect(delivered).toBe(1);
    expect(restarted.pendingCount()).toBe(0);
  });
});
