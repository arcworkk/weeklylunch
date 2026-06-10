import nodeCrypto from "node:crypto";

if (!nodeCrypto.getRandomValues && nodeCrypto.webcrypto?.getRandomValues) {
  nodeCrypto.getRandomValues =
    nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto);
}

if (!globalThis.crypto?.getRandomValues && nodeCrypto.webcrypto) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: nodeCrypto.webcrypto
  });
}

const { build } = await import("vite");

await build();
