export function hasFSA(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window;
}

export async function openProjectFile(): Promise<{ raw: string; handle: FileSystemFileHandle | null }> {
  if (hasFSA()) {
    try {
      const [handle] = await (window as Window & typeof globalThis & {
        showOpenFilePicker: (opts?: object) => Promise<FileSystemFileHandle[]>;
      }).showOpenFilePicker({
        types: [{ description: "Freewrite Project", accept: { "application/json": [".json"] } }],
        multiple: false,
      });
      const file = await handle.getFile();
      const raw = await file.text();
      return { raw, handle };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      throw new Error(`Failed to open file: ${(e as Error).message}`);
    }
  }

  // Fallback: file input
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error("No file selected")); return; }
      const raw = await file.text();
      resolve({ raw, handle: null });
    };
    input.oncancel = () => reject(new Error("AbortError"));
    input.click();
  });
}

export async function saveProjectFile(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function saveProjectFileAs(content: string, suggestedName: string): Promise<FileSystemFileHandle | null> {
  if (hasFSA()) {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (opts?: object) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName,
        types: [{ description: "Freewrite Project", accept: { "application/json": [".json"] } }],
      });
      await saveProjectFile(handle, content);
      return handle;
    } catch (e) {
      if ((e as Error).name === "AbortError") return null;
      throw e;
    }
  }
  downloadProjectFile(content, suggestedName);
  return null;
}

export function downloadProjectFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
