import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
  collectSeaOfficialPluginAssets,
  officialSeaPlugins,
} from "./sea-official-plugin-assets.mjs";

const cliRoot = resolve(import.meta.dirname, "../../..");

test("SEA official plugin assets include the first-party phase-one plugins", async () => {
  const stagingDirectory = await mkdtemp(resolve(tmpdir(), "zcode-official-plugin-assets-test-"));
  try {
    const { manifest } = await collectSeaOfficialPluginAssets({
      requireRuntime: true,
      root: cliRoot,
      stagingDirectory,
    });

    const expectedNames = [
      "browser-use",
      "node-repl-host",
      "plugin-creator",
      "restore-legacy-sessions",
      "skill-creator",
      "zcode-guide",
    ];
    assert.deepEqual(
      manifest.plugins.map((plugin) => plugin.name).sort(),
      expectedNames,
    );
    assert.deepEqual(
      officialSeaPlugins.map((plugin) => plugin.name).sort(),
      expectedNames,
    );

    for (const plugin of manifest.plugins) {
      assert.ok(plugin.files.length > 0, `${plugin.name} must contain seed files`);
      assert.ok(
        plugin.files.every((file) => !file.path.split("/").includes("node_modules")),
        `${plugin.name} must not embed node_modules`,
      );
    }
  } finally {
    await rm(stagingDirectory, { force: true, recursive: true });
  }
});
