const { createRequire } = require("module");
const path = require("path");

const reqServer = createRequire(path.join(process.cwd(), "apps/server/noop.js"));
const reqWeb = createRequire(path.join(process.cwd(), "apps/web/noop.js"));

const { Server } = reqServer("@hocuspocus/server");
const { HocuspocusProvider } = reqWeb("@hocuspocus/provider");
const Y = reqWeb("yjs");
const ws = require("ws");

globalThis.WebSocket = ws;

async function runCollaborationTest() {
  console.log("--- 1. Starting Hocuspocus Server on port 12345 ---");
  const server = Server.configure({
    port: 12345,
  });
  await server.listen();
  console.log("Server listening on ws://127.0.0.1:12345 !");

  console.log("--- 2. Connecting Client A to room 'test-room' ---");
  const docA = new Y.Doc();
  const providerA = new HocuspocusProvider({
    url: "ws://127.0.0.1:12345",
    name: "test-room",
    document: docA,
  });

  providerA.awareness.setLocalStateField("user", {
    name: "Writer Alice",
    color: "#4f8ef7",
  });

  console.log("--- 3. Connecting Client B to room 'test-room' ---");
  const docB = new Y.Doc();
  const providerB = new HocuspocusProvider({
    url: "ws://127.0.0.1:12345",
    name: "test-room",
    document: docB,
  });

  providerB.awareness.setLocalStateField("user", {
    name: "Writer Bob",
    color: "#34d399",
  });

  // Wait for connections to establish
  await new Promise((r) => setTimeout(r, 1200));

  console.log("--- 4. Client A creates and edits a dialogue node ---");
  const convsMapA = docA.getMap("conversations");
  const convA = new Y.Map();
  convA.set("id", "conv-1");
  convA.set("title", "Opening Dialogue");

  const nodesMapA = new Y.Map();
  nodesMapA.set("node-1", {
    id: "node-1",
    type: "dialogue",
    dialogueText: "Greetings, traveler!",
    position: { x: 100, y: 150 },
  });
  convA.set("nodes", nodesMapA);
  convsMapA.set("conv-1", convA);

  // Wait for CRDT update to replicate to Client B
  await new Promise((r) => setTimeout(r, 1000));

  console.log("--- 5. Checking Client B replicated state ---");
  const convsMapB = docB.getMap("conversations");
  const convB = convsMapB.get("conv-1");
  const nodesMapB = convB ? convB.get("nodes") : null;
  const node1OnB = nodesMapB ? nodesMapB.get("node-1") : null;

  console.log("Client B received node text:", node1OnB?.dialogueText);
  console.log("Client B received node pos:", node1OnB?.position);

  if (node1OnB?.dialogueText === "Greetings, traveler!") {
    console.log(">>> SUCCESS: Real-time CRDT sync verified between Client A and Client B!");
  } else {
    throw new Error("Failed to replicate node to Client B!");
  }

  console.log("--- 6. Checking Awareness presence ---");
  const statesOnA = providerA.awareness.getStates();
  console.log("Awareness states count on Client A:", statesOnA.size);
  statesOnA.forEach((state, id) => {
    console.log(` - Client ${id}: ${state.user?.name} (${state.user?.color})`);
  });

  providerA.destroy();
  providerB.destroy();
  await server.destroy();
  console.log("--- All collaboration tests passed cleanly! ---");
}

runCollaborationTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
