import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveDesktopProductIdentity,
  resolveDesktopProductFlavor,
  resolveWindowsAppUserModelId,
} from "./desktop-product-identity.mjs";

test("production identity uses yuCode display name but preserves app id", () => {
  const env = { ZCODE_ENV: "production", ZCODE_PREVIEW_IDENTITY: "0" };

  assert.equal(resolveDesktopProductFlavor(env), "production");
  assert.equal(resolveDesktopProductIdentity(env).productName, "yuCode");
  assert.equal(resolveDesktopProductIdentity(env).appId, "dev.zcode.app");
  assert.equal(resolveDesktopProductIdentity(env).linuxExecutableName, "yucode");
});

test("preview identity uses the yuCode Preview display name", () => {
  const env = { ZCODE_ENV: "test", ZCODE_PREVIEW_IDENTITY: "0" };

  assert.equal(resolveDesktopProductFlavor(env), "preview");
  assert.equal(resolveDesktopProductIdentity(env).productName, "yuCode Preview");
  assert.equal(resolveDesktopProductIdentity(env).appId, "dev.zcode.app.preview");
  assert.equal(resolveDesktopProductIdentity(env).linuxExecutableName, "yucode-preview");
});

test("explicit production preview identity keeps the preview app id", () => {
  const env = { ZCODE_ENV: "production", ZCODE_PREVIEW_IDENTITY: "1" };

  assert.equal(resolveDesktopProductFlavor(env), "preview");
  assert.equal(resolveDesktopProductIdentity(env).productName, "yuCode Preview");
  assert.equal(resolveDesktopProductIdentity(env).appId, "dev.zcode.app.preview");
});

test("Windows development AUMID remains legacy compatible", () => {
  const env = { ZCODE_ENV: "production", ZCODE_PREVIEW_IDENTITY: "0" };

  assert.equal(resolveWindowsAppUserModelId(env, { isPackaged: false }), "cn.aminer.zcode");
});
