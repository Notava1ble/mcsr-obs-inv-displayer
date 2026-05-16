import chokidar from "chokidar";

export type StopWatching = () => void;

export function watchFileChanges(
  file: string,
  onChange: () => void,
  debounceMs = 100,
): StopWatching {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const watcher = chokidar.watch(file).on("change", () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(onChange, debounceMs);
  });

  return () => {
    if (timeout) clearTimeout(timeout);
    void watcher.close();
  };
}
