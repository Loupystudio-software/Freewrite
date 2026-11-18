import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const server = Server.configure({
  port: 1234,
  async onLoadDocument(data: { documentName: string; document: Y.Doc }) {
    const filePath = path.join(DATA_DIR, `${data.documentName}.ydoc`);
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        Y.applyUpdate(data.document, new Uint8Array(buffer));
      } catch (err) {
        console.error(`Failed to load persisted document ${data.documentName}:`, err);
      }
    }
    return data.document;
  },
  async onStoreDocument(data: { documentName: string; document: Y.Doc }) {
    const filePath = path.join(DATA_DIR, `${data.documentName}.ydoc`);
    try {
      const update = Y.encodeStateAsUpdate(data.document);
      fs.writeFileSync(filePath, Buffer.from(update));
    } catch (err) {
      console.error(`Failed to store persisted document ${data.documentName}:`, err);
    }
  },
});

server.listen().then(() => {
  console.log(`[Freewrite Server] Hocuspocus collaboration server listening on ws://localhost:1234`);
});
