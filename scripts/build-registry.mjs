import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const paths = [
  "src/core.ts",
  "src/engine.ts",
  "src/element.ts",
  "src/adapters/native.ts",
  "src/adapters/react.tsx",
  "src/adapters/vue.ts",
  "src/adapters/Loom.svelte",
  "src/adapters/svelte.ts",
];
const files = await Promise.all(
  paths.map(async (path) => {
    const content = await readFile(path, "utf8");
    return {
      path,
      content,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  }),
);
await writeFile(
  "public/registry.json",
  JSON.stringify(
    {
      name: "phase-loom",
      version: "0.1.0",
      format: "melodicbloom-source-manifest-v1",
      dependencies: {
        renderer: ["three"],
        react: ["react", "react-dom"],
        vue: ["vue"],
        svelte: ["svelte"],
      },
      devDependencies: [
        "typescript",
        "@types/three",
        "@types/react",
        "@types/react-dom",
      ],
      files,
    },
    null,
    2,
  ) + "\n",
);
