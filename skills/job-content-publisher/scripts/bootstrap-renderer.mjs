import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const RENDERER_VERSION = "0.2.0";
const RENDERER_SOURCE = `https://github.com/Amentman/xiaohongshu-image-renderer/tree/v${RENDERER_VERSION}`;

export function buildBootstrapPlan({ platform = process.platform } = {}) {
  const npx = platform === "win32" ? "npx.cmd" : "npx";
  return [
    {
      command: npx,
      args: [
        "skills", "add",
        RENDERER_SOURCE,
        "--skill", "xiaohongshu-image-renderer",
        "--agent", "codex",
        "--global", "--yes", "--copy",
      ],
    },
    {
      command: npx,
      args: ["skills", "list", "--global", "--json"],
    },
  ];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}.`);
  }
  return result.stdout || "";
}

export function findReadyRenderer(items) {
  return items.find(item => {
    if (item.name !== "xiaohongshu-image-renderer" || !item.path) return false;
    const packagePath = path.join(item.path, "package.json");
    if (!fs.existsSync(path.join(item.path, "SKILL.md"))
      || !fs.existsSync(path.join(item.path, "scripts", "bootstrap.mjs"))
      || !fs.existsSync(packagePath)) return false;
    try {
      return JSON.parse(fs.readFileSync(packagePath, "utf8")).version === RENDERER_VERSION;
    } catch {
      return false;
    }
  });
}

export function locateRenderer({ platform = process.platform } = {}) {
  const [, listStep] = buildBootstrapPlan({ platform });
  const items = JSON.parse(run(listStep.command, listStep.args, { capture: true }));
  return findReadyRenderer(items) || null;
}

export function checkRenderer(options = {}) {
  const renderer = locateRenderer(options);
  if (!renderer) return null;
  const result = spawnSync(process.execPath, [path.join(renderer.path, "scripts", "bootstrap.mjs"), "--check"], {
    stdio: "inherit",
  });
  return result.status === 0 ? renderer : null;
}

export function installRenderer({ platform = process.platform } = {}) {
  const [installStep] = buildBootstrapPlan({ platform });
  run(installStep.command, installStep.args);
  const renderer = locateRenderer({ platform });
  if (!renderer) throw new Error("Renderer installation completed but a runnable Skill was not discovered.");
  run(process.execPath, [path.join(renderer.path, "scripts", "bootstrap.mjs"), "--install"]);
  return renderer;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync.native(process.argv[1]) === fs.realpathSync.native(scriptPath);
  } catch {
    return path.resolve(process.argv[1]) === path.resolve(scriptPath);
  }
}

function runCli() {
  const mode = process.argv[2] || "--check";
  if (mode === "--dry-run") {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", steps: buildBootstrapPlan() }, null, 2)}\n`);
    return;
  }
  if (mode === "--check") {
    const renderer = checkRenderer();
    process.stdout.write(`${JSON.stringify(renderer
      ? { status: "ready", rendererPath: renderer.path }
      : { status: "missing" }, null, 2)}\n`);
    process.exitCode = renderer ? 0 : 1;
    return;
  }
  if (mode !== "--install") {
    throw new Error("Usage: node scripts/bootstrap-renderer.mjs [--check|--install|--dry-run]");
  }
  const renderer = installRenderer();
  process.stdout.write(`${JSON.stringify({ status: "ready", rendererPath: renderer.path }, null, 2)}\n`);
}

if (isMainModule()) runCli();
