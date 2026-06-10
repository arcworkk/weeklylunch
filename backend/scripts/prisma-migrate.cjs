const { spawnSync } = require("node:child_process");

const run = (args) => {
  const result = spawnSync("prisma", args, {
    env: {
      ...process.env,
      RUST_LOG: process.env.RUST_LOG || "info"
    },
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run(["migrate", "deploy"]);
run(["generate"]);
