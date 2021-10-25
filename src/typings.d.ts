declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare const DEFAULT_BEATMAPS: string[];

// File and Directory Entries API
// Used for drag & drop beatmaps

interface FileSystem {
  readonly name: string;
  readonly root: FileSystemDirectoryEntry;
}

interface FileSystemEntry {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly name: string;
  readonly fullPath: string;
  readonly filesystem: FileSystem;
  getParent(
    successCallback?: FileSystemEntryCallback,
    errorCallback?: ErrorCallback
  ): void;
}

interface FileSystemFileEntry extends FileSystemEntry {
  file(successCallback: FileCallback, errorCallback?: ErrorCallback): void;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader;
  getDirectory(
    path?: string | null,
    options?: FileSystemFlags,
    successCallback?: FileSystemEntryCallback,
    errorCallback?: ErrorCallback
  ): void;
  getFile(
    path?: string | null,
    options?: FileSystemFlags,
    successCallback?: FileSystemEntryCallback,
    errorCallback?: ErrorCallback
  ): void;
}

interface FileSystemDirectoryReader {
  readEntries(
    successCallback: FileSystemEntriesCallback,
    errorCallback?: ErrorCallback
  ): void;
}

type FileSystemFlags = Partial<{
  create: boolean;
  exclusive: boolean;
}>;

type FileCallback = (file: File) => void;
type FileSystemEntryCallback = (entry: FileSystemEntry) => void;
type FileSystemEntriesCallback = (entries: FileSystemEntry[]) => void;
type ErrorCallback = (err: DOMException) => void;

interface DataTransferItem {
  webkitGetAsEntry(): ?FileSystemEntry;
}
