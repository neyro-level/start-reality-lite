import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

type Manifest = {
  projectId: string;
  catalogRevision: string;
  files: Array<{
    kind: string;
    key: string;
    sha256: string;
    bytes: number;
    count: number;
  }>;
  keyId: string;
  signature?: string;
  schemaMajor: number;
  schemaMinor: number;
  schemaPatch?: number;
  publishSequence: number;
  generatedAt: string;
  publishedAt: string;
  sourceRevisions: string[];
};

function toLf(bytes: Buffer): Buffer {
  return Buffer.from(
    bytes.toString("binary").replaceAll("\r\n", "\n"),
    "binary",
  );
}

function resign(name: string) {
  const dir = join(root, "fixtures", name);
  const manifestPath = join(dir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  delete manifest.signature;

  for (const file of manifest.files) {
    const path = join(dir, file.key);
    const bytes = toLf(readFileSync(path));
    writeFileSync(path, bytes);
    file.sha256 = createHash("sha256").update(bytes).digest("hex");
    file.bytes = bytes.byteLength;
  }

  const keyB64 = toLf(readFileSync(join(dir, "keys/pkcs8.b64")))
    .toString("utf8")
    .trim();
  const privateKey = createPrivateKey({
    key: Buffer.from(keyB64, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`, "utf8");
  writeFileSync(manifestPath, manifestBytes);
  writeFileSync(
    join(dir, "manifest.sig"),
    sign(null, manifestBytes, privateKey),
  );
  const developers = manifest.files.find((file) => file.kind === "developers");
  console.log("resigned", name, developers);
}

resign("fixture-demo");
resign("fixture-alt");
