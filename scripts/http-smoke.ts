import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SMOKE_FIXTURE = "fixture-sz-rostov";

const PORT = process.env.VERIFY_HTTP_PORT ?? "4017";
const ORIGIN = `http://127.0.0.1:${PORT}`;

async function waitForHealth(timeoutMs = 90_000): Promise<void> {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${ORIGIN}/healthz`);
      last = `${response.status}`;
      if (response.ok) {
        return;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`healthz not ready: ${last}`);
}

async function expectStatus(
  path: string,
  status: number,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${ORIGIN}${path}`, {
    redirect: "manual",
    ...init,
  });
  if (response.status !== status) {
    throw new Error(`${path} expected ${status}, got ${response.status}`);
  }
  return response;
}

function startProductionServer(root: string): ChildProcess {
  const nextBin = join(root, "node_modules/next/dist/bin/next");
  return spawn(process.execPath, [nextBin, "start", "-p", PORT], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      APP_ENV: "local",
      DATA_MODE: "local",
      PROJECT_FIXTURE: SMOKE_FIXTURE,
      LEADS_ROUTE: "direct",
      LEAD_TRANSPORT: "none",
      INDEXING_MODE: "private",
      PORT,
    },
    stdio: "pipe",
  });
}

function runNextBuild(root: string): Promise<void> {
  const nextBin = join(root, "node_modules/next/dist/bin/next");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "production",
        APP_ENV: "local",
        DATA_MODE: "local",
        PROJECT_FIXTURE: SMOKE_FIXTURE,
      },
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`next build exited ${code}`));
    });
  });
}

export async function runExitHttpSmoke(root: string): Promise<void> {
  if (process.env.VERIFY_SKIP_HTTP_SMOKE === "1") {
    console.log("SKIP http-smoke VERIFY_SKIP_HTTP_SMOKE=1");
    return;
  }
  const marker = join(root, ".next/ams-smoke-fixture");
  const builtFixture = existsSync(marker)
    ? readFileSync(marker, "utf8").trim()
    : "";
  if (!existsSync(join(root, ".next")) || builtFixture !== SMOKE_FIXTURE) {
    console.log(`http-smoke running next build (${SMOKE_FIXTURE})`);
    await runNextBuild(root);
    writeFileSync(marker, `${SMOKE_FIXTURE}\n`);
  }
  const server = startProductionServer(root);
  try {
    await waitForHealth();
    await expectStatus("/", 200);
    await expectStatus("/primersk/kvartiry/", 200);
    await expectStatus("/kvartiry/listing-1-aaaaab/", 200);
    await expectStatus("/novostroyki/zhk-1/", 200);
    await expectStatus("/komanda/agent-1/", 200);
    await expectStatus("/this-page-does-not-exist-th7/", 404);
    await expectStatus("/blog/", 410);
    const redirected = await expectStatus("/novostroyki-city/", 308);
    const location = redirected.headers.get("location") ?? "";
    if (!location.includes("/primersk/novostroyki/")) {
      throw new Error(`308 location unexpected: ${location}`);
    }
    const health = await fetch(`${ORIGIN}/healthz`, { redirect: "follow" });
    if (!health.ok) {
      throw new Error(
        `/healthz expected 200 after follow, got ${health.status}`,
      );
    }
    const lead = await expectStatus("/api/public/leads/", 503, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Тест",
        phone: "+78000000000",
        consent: true,
        pageKey: "home",
      }),
    });
    const payload = (await lead.json()) as { code?: string };
    if (payload.code !== "lead_transport_disabled") {
      throw new Error(`lead code unexpected: ${payload.code}`);
    }
    console.log("http-smoke PASS");
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!server.killed) {
      server.kill("SIGKILL");
    }
  }
}
