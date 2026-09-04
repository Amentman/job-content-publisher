import assert from "node:assert/strict";
import test from "node:test";

import { buildBootstrapPlan } from "./bootstrap-renderer.mjs";

test("one bootstrap installs the renderer globally for Codex and verifies discovery", () => {
  assert.deepEqual(buildBootstrapPlan({ platform: "darwin" }), [
    {
      command: "npx",
      args: [
        "skills", "add",
        "Amentman/xiaohongshu-image-renderer",
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

test("one bootstrap uses the npx command shim on Windows", () => {
  const [install] = buildBootstrapPlan({ platform: "win32" });
  assert.equal(install.command, "npx.cmd");
});
