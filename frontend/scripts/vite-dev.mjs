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

const { createServer } = await import("vite");

const server = await createServer({
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});

await server.listen();
server.printUrls();
