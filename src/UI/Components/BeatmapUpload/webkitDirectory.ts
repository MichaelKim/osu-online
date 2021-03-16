import { Directory } from './loadBeatmaps';

function addFileToDirectory(dir: Directory, path: string[], file: File) {
  if (path.length <= 0) return;
  if (path.length === 1) {
    dir.files[path[0]] = file;
    return;
  }

  const [first, ...rest] = path;

  if (dir.files[first] == null || dir.files[first] instanceof File) {
    if (dir.files[first] != null) {
      console.warn('duplicate file and directory name:', first);
    }

    dir.files[first] = {
      name: first,
      files: {}
    };
  }

  addFileToDirectory(dir.files[first] as Directory, rest, file);
}

export function getFilesFromInput(files: FileList) {
  const root: Directory = {
    name: '',
    files: {}
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // @ts-expect-error: non-standard API
    const filePath: string = file.webkitRelativePath;
    const path = filePath.split('/');

    addFileToDirectory(root, path, file);
  }

  return root;
}
