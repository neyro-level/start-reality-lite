import { loadEnv } from "../src/platform/env";
import {
  runWorkerPass,
  shouldRunSnapshotJobs,
} from "../src/platform/runtime-worker";
import {
  consumeSyncSignal,
  DEFAULT_RESERVED_SLUGS,
  openSnapshotStore,
} from "../src/platform/snapshot";
import { grammar } from "../src/project/grammar.config";

const POLL_MS = Number(process.env.SYNC_POLL_MS ?? 15_000);
const TICK_MS = Number(process.env.SYNC_TICK_MS ?? 1_000);

const reservedRoots = [
  ...DEFAULT_RESERVED_SLUGS,
  grammar.developersSegment,
  grammar.developmentSegment,
  grammar.propertySegment,
  grammar.objectNamespace,
  grammar.teamSegment,
];

async function main(): Promise<void> {
  const cwd = process.cwd();
  let lastPoll = 0;
  while (true) {
    const env = loadEnv();
    let snapshotDue = false;
    if (shouldRunSnapshotJobs(env)) {
      if (env.SNAPSHOT_STORE_DIR) {
        const store = openSnapshotStore(env.SNAPSHOT_STORE_DIR);
        const signaled = consumeSyncSignal(store);
        snapshotDue = signaled || Date.now() - lastPoll >= POLL_MS;
      } else {
        snapshotDue = Date.now() - lastPoll >= POLL_MS;
      }
      if (snapshotDue) {
        lastPoll = Date.now();
      }
    }
    await runWorkerPass({
      cwd,
      env,
      reservedRoots,
      snapshotDue,
    });
    await new Promise((resolve) => setTimeout(resolve, TICK_MS));
  }
}

void main();
