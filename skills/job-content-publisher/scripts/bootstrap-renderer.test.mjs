import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildBootstrapPlan, findReadyRenderer } from "./bootstrap-renderer.mjs";

test("one bootstrap installs the renderer globally for Codex and verifies discovery", () => {
  assert.deepEqual(buildBootstrapPlan({ platform: "darwin" }), [
    {
      command: "npx",
      args: [
        "skills", "add",
        "https://github.com/Amentman/xiaohongshu-image-renderer/tree/v0.2.0",
        "--skill", "xiaohongshu-image-renderer",
        "--agent", "codex",
        "--global", "--yes", "--copy",
      ],
    },
    {
      command: "npx",
      args: ["skills", "list", "--global", "--json"],
    },
  ]);
});

test("discovery rejects an installed renderer with the wrong release version", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "renderer-version-"));
  fs.writeFileSync(path.join(root, "SKILL.md"), "---\nname: xiaohongshu-image-renderer\n---\n");
  fs.mkdirSync(path.join(root, "scripts"));
  fs.writeFileSync(path.join(root, "scripts", "bootstrap.mjs"), "");
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version: "0.1.1" }));
  const item = { name: "xiaohongshu-image-renderer", path: root };

  assert.equal(findReadyRenderer([item]), undefined);

  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ version: "0.2.0" }));
  assert.equal(findReadyRenderer([item]), item);
});

test("one bootstrap uses the npx command shim on Windows", () => {
  const [install] = buildBootstrapPlan({ platform: "win32" });
  assert.equal(install.command, "npx.cmd");
});
