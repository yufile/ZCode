import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { writeOfficialPluginRuntimeManifest } from "../src/app/official-plugin-runtime.ts";

async function createPluginRoot(manifest: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "zcode-official-plugin-runtime-test-"));
  const manifestDirectory = join(root, ".zcode-plugin");
  await mkdir(manifestDirectory, { recursive: true });
  await writeFile(join(manifestDirectory, "plugin.json"), JSON.stringify(manifest, null, 2));
  return root;
}

async function readPluginManifest(root: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(join(root, ".zcode-plugin", "plugin.json"), "utf8"));
}

test("official runtime keeps remote HTTP MCP configuration unchanged", async () => {
  const root = await createPluginRoot({
    mcpServers: {
      image_search: {
        auth: { provider: "jwt_token", type: "zcode_official" },
        timeoutMs: 90000,
        type: "http",
        url: "${ZCODE_BASE_URL}/api/v1/mcp/server/image_search",
      },
    },
  });

  try {
    writeOfficialPluginRuntimeManifest({ pluginName: "image-search", rootPath: root });
    const manifest = await readPluginManifest(root);
    assert.deepEqual(manifest.mcpServers.image_search, {
      auth: { provider: "jwt_token", type: "zcode_official" },
      timeoutMs: 90000,
      type: "http",
      url: "${ZCODE_BASE_URL}/api/v1/mcp/server/image_search",
    });
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("official runtime rewrites local stdio MCP configuration", async () => {
  const root = await createPluginRoot({
    mcpServers: {
      android: {
        args: ["original-server.js"],
        command: "node",
        env: { KEEP_ME: "1" },
      },
    },
  });
  const previousArgv1 = process.argv[1];
  process.argv[1] = import.meta.filename;

  try {
    writeOfficialPluginRuntimeManifest({ pluginName: "android-emulator", rootPath: root });
    const manifest = await readPluginManifest(root);
    const server = manifest.mcpServers.android;
    assert.equal(server.command, process.execPath);
    assert.equal(server.env.KEEP_ME, "1");
    assert.equal(server.env.ZCODE_PLUGIN_ID, "android-emulator@zcode-plugins-official");
    assert.equal(server.args.at(-1), join(root, "dist", "mcp", "server.js"));
  } finally {
    process.argv[1] = previousArgv1;
    await rm(root, { force: true, recursive: true });
  }
});
