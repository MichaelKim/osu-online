import { Directory } from './loadBeatmaps';

async function readEntries(dir: Directory, entries: FileSystemEntry[]) {
  for (const entry of entries) {
    if (entry.isFile) {
      dir.files[entry.name] = await readFile(entry as FileSystemFileEntry);
    } else if (entry.isDirectory) {
      if (dir.files[entry.name] instanceof File) {
        console.warn('duplicate file and directory name:', entry.name);
      }

      dir.files[entry.name] = {
        name: entry.name,
        files: {}
      };

      await readDirectory(
        dir.files[entry.name] as Directory,
        entry as FileSystemDirectoryEntry
      );
    }
  }
}

async function readFile(file: FileSystemFileEntry) {
  return new Promise<File>((resolve, reject) => file.file(resolve, reject));
}

async function readDirectory(dir: Directory, entry: FileSystemDirectoryEntry) {
  const reader = entry.createReader();
  const entries: FileSystemEntry[] = [];

  for (;;) {
    const newEntries = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject)
    );
    if (newEntries.length === 0) break;
    entries.push(...newEntries);
  }

  await readEntries(dir, entries);
}

export async function getFilesFromDrop(items: DataTransferItemList) {
  const entries: FileSystemEntry[] = [];

  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry();
    if (entry) {
      entries.push(entry);
    }
  }

  const root: Directory = {
    name: '',
    files: {}
  };

  await readEntries(root, entries);

  return root;
}
