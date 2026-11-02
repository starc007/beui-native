export type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";

export type ToastAction = {
  label: string;
  onPress: () => void;
};

export type ToastOptions = {
  id?: string;
  description?: string;
  status?: ToastStatus;
  action?: ToastAction;
  /** Milliseconds before it leaves; 0 keeps it up. Loading toasts stay up. */
  duration?: number;
  /** Whether a swipe can dismiss it. Defaults to true. */
  dismissible?: boolean;
};

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  status: ToastStatus;
  action?: ToastAction;
  duration: number;
  dismissible: boolean;
  /** Set when it starts leaving; the Toaster removes it after its exit. */
  dismissed: boolean;
};

const DEFAULT_DURATION = 4000;

type Timer = {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
};

let items: ToastItem[] = [];
let paused = false;
let seed = 0;
const timers = new Map<string, Timer>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function lifetime(item: ToastItem) {
  return item.status === "loading" ? 0 : item.duration;
}

function startTimer(id: string, ms: number) {
  stopTimer(id);
  if (ms <= 0) return;
  const timer: Timer = { handle: null, remaining: ms, startedAt: Date.now() };
  if (!paused) timer.handle = setTimeout(() => dismiss(id), ms);
  timers.set(id, timer);
}

function stopTimer(id: string) {
  const timer = timers.get(id);
  if (timer?.handle) clearTimeout(timer.handle);
  timers.delete(id);
}

function show(title: string, options: ToastOptions = {}) {
  const id = options.id ?? `toast-${Date.now()}-${seed++}`;
  if (items.some((item) => item.id === id)) {
    update(id, { ...options, title });
    return id;
  }
  const item: ToastItem = {
    id,
    title,
    description: options.description,
    status: options.status ?? "neutral",
    action: options.action,
    duration: options.duration ?? DEFAULT_DURATION,
    dismissible: options.dismissible ?? true,
    dismissed: false,
  };
  items = [...items, item];
  startTimer(id, lifetime(item));
  emit();
  return id;
}

function update(id: string, patch: ToastOptions & { title?: string }) {
  let changed: ToastItem | undefined;
  items = items.map((item) => {
    if (item.id !== id) return item;
    changed = {
      ...item,
      ...patch,
      id,
      duration: patch.duration ?? item.duration,
      status: patch.status ?? item.status,
    };
    return changed;
  });
  // A new status or duration restarts the clock.
  if (changed && (patch.status || patch.duration !== undefined))
    startTimer(id, lifetime(changed));
  emit();
}

function dismiss(id?: string) {
  const ids = id ? [id] : items.map((item) => item.id);
  for (const each of ids) stopTimer(each);
  items = items.map((item) =>
    ids.includes(item.id) ? { ...item, dismissed: true } : item,
  );
  emit();
}

function promise<T>(
  task: Promise<T>,
  messages: {
    loading: string;
    success: string | ((value: T) => string);
    error: string | ((error: unknown) => string);
  },
  options: Omit<ToastOptions, "status"> = {},
) {
  const id = show(messages.loading, { ...options, status: "loading" });
  task.then(
    (value) =>
      update(id, {
        status: "success",
        title:
          typeof messages.success === "function"
            ? messages.success(value)
            : messages.success,
      }),
    (error: unknown) =>
      update(id, {
        status: "error",
        title:
          typeof messages.error === "function"
            ? messages.error(error)
            : messages.error,
      }),
  );
  return task;
}

type Show = (title: string, options?: Omit<ToastOptions, "status">) => string;
const withStatus =
  (status: ToastStatus): Show =>
  (title, options) =>
    show(title, { ...options, status });

/**
 * Shows a toast from anywhere. Mount one `<Toaster />` near the app root to
 * display them.
 */
export const toast = Object.assign(
  (title: string, options?: ToastOptions) => show(title, options),
  {
    success: withStatus("success"),
    error: withStatus("error"),
    info: withStatus("info"),
    loading: withStatus("loading"),
    update,
    dismiss,
    promise,
  },
);

/** Internal: the Toaster's view of the store. */
export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => items,
  /** Drops a toast once its exit has played. */
  remove(id: string) {
    stopTimer(id);
    items = items.filter((item) => item.id !== id);
    emit();
  },
  /** Holds every timer while a finger is down or the stack is open. */
  pause() {
    if (paused) return;
    paused = true;
    const now = Date.now();
    for (const timer of timers.values()) {
      if (timer.handle) clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
  },
  resume() {
    if (!paused) return;
    paused = false;
    for (const [id, timer] of timers) {
      timer.startedAt = Date.now();
      timer.handle = setTimeout(() => dismiss(id), timer.remaining);
    }
  },
};
