import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { type TextInput, View, type ViewProps } from "react-native";

export type Anchor = { x: number; y: number; width: number; height: number };

import { useReducedMotionPreference } from "../../hooks/use-reduced-motion";

export type MultiSelectFilter = (
  value: string,
  query: string,
  keywords: string[],
) => boolean;

/** Matches when the query's characters appear in order, like the web version. */
const defaultFilter: MultiSelectFilter = (value, query, keywords) => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  const haystack = [value, ...keywords].join(" ").toLocaleLowerCase();
  let at = 0;
  for (const character of haystack) {
    if (character === needle[at]) at += 1;
    if (at === needle.length) return true;
  }
  return false;
};

export type RegisteredItem = {
  value: string;
  label: string;
  keywords: string[];
  disabled: boolean;
};

export type MultiSelectContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  values: string[];
  toggle: (value: string) => void;
  remove: (value: string) => void;
  query: string;
  setQuery: (query: string) => void;
  register: (item: RegisteredItem) => void;
  unregister: (value: string) => void;
  labelFor: (value: string) => string;
  isVisible: (value: string) => boolean;
  visibleCount: number;
  /** The first visible option that can be picked, for the return key. */
  firstMatch: string | null;
  disabled: boolean;
  reduce: boolean;
  inputRef: RefObject<TextInput | null>;
  triggerRef: RefObject<View | null>;
  /** The trigger's frame in the window, measured as the panel opens. */
  anchor: Anchor | null;
  /** Measures the trigger again, such as after chips change its height. */
  measure: () => void;
};

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null);

/**
 * True inside the hidden copy of the options that MultiSelectContent keeps
 * mounted, so chips know every label before the panel first opens.
 */
export const RegistryContext = createContext(false);

/** Lets a group hide itself while a query leaves none of its options. */
export const MultiSelectGroupContext = createContext<
  ((value: string, visible: boolean) => void) | null
>(null);

export function useMultiSelectContext(component: string) {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error(`${component} must be used within <MultiSelect>`);
  }
  return context;
}

export type MultiSelectProps = Omit<ViewProps, "children"> & {
  children: ReactNode;
  /** Controlled selection. Omit it and use `defaultValue` for uncontrolled use. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Decides which options a query shows. Defaults to an in-order character match. */
  filter?: MultiSelectFilter;
  disabled?: boolean;
  /** Moves without springing, independently of the system preference. */
  disableAnimation?: boolean;
  className?: string;
};

/**
 * Picks several options from a searchable list. Compose MultiSelectTrigger
 * (with MultiSelectValue) and MultiSelectContent (with MultiSelectInput and
 * MultiSelectList) inside.
 */
export function MultiSelect({
  children,
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  query: controlledQuery,
  defaultQuery = "",
  onQueryChange,
  filter = defaultFilter,
  disabled = false,
  disableAnimation = false,
  className = "",
  ...props
}: MultiSelectProps) {
  const reducedMotion = useReducedMotionPreference();
  const reduce = reducedMotion || disableAnimation;
  const inputRef = useRef<TextInput>(null);
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const [items, setItems] = useState<Map<string, RegisteredItem>>(new Map());

  const values = controlledValue ?? internalValue;
  const open = controlledOpen ?? internalOpen;
  const query = controlledQuery ?? internalQuery;
  const valueControlled = controlledValue !== undefined;
  const openControlled = controlledOpen !== undefined;
  const queryControlled = controlledQuery !== undefined;

  const setQuery = useCallback(
    (next: string) => {
      if (!queryControlled) setInternalQuery(next);
      onQueryChange?.(next);
    },
    [onQueryChange, queryControlled],
  );

  const measure = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor((current) =>
        current?.x === x &&
        current.y === y &&
        current.width === width &&
        current.height === height
          ? current
          : { x, y, width, height },
      );
    });
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (next === open) return;
      if (next) {
        // Find the trigger on screen before the panel appears beside it.
        triggerRef.current?.measureInWindow((x, y, width, height) => {
          setAnchor({ x, y, width, height });
          if (!openControlled) setInternalOpen(true);
          onOpenChange?.(true);
        });
        return;
      }
      if (!openControlled) setInternalOpen(false);
      onOpenChange?.(false);
      setQuery("");
    },
    [disabled, onOpenChange, open, openControlled, setQuery],
  );

  const register = useCallback((item: RegisteredItem) => {
    setItems((current) => {
      const existing = current.get(item.value);
      if (
        existing?.label === item.label &&
        existing.disabled === item.disabled &&
        existing.keywords.join("\u0000") === item.keywords.join("\u0000")
      ) {
        return current;
      }
      const next = new Map(current);
      next.set(item.value, item);
      return next;
    });
  }, []);

  const unregister = useCallback((value: string) => {
    setItems((current) => {
      if (!current.has(value)) return current;
      const next = new Map(current);
      next.delete(value);
      return next;
    });
  }, []);

  // While the panel folds closed, it keeps filtering by the query it was open
  // with, so its rows don't jump back to the full list mid-fold.
  const [openQuery, setOpenQuery] = useState(query);
  if (open && openQuery !== query) setOpenQuery(query);
  const listQuery = open ? query : openQuery;

  const visible = useMemo(
    () =>
      Array.from(items.values()).filter((item) =>
        filter(item.value, listQuery, [item.label, ...item.keywords]),
      ),
    [filter, items, listQuery],
  );
  const visibleValues = useMemo(
    () => new Set(visible.map((item) => item.value)),
    [visible],
  );

  const commit = useCallback(
    (next: string[]) => {
      if (!valueControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [onValueChange, valueControlled],
  );

  const toggle = useCallback(
    (value: string) => {
      if (items.get(value)?.disabled) return;
      commit(
        values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      );
      setQuery("");
    },
    [commit, items, setQuery, values],
  );

  const remove = useCallback(
    (value: string) => {
      if (!values.includes(value)) return;
      commit(values.filter((item) => item !== value));
    },
    [commit, values],
  );

  const context = useMemo<MultiSelectContextValue>(
    () => ({
      open,
      setOpen,
      values,
      toggle,
      remove,
      query,
      setQuery,
      register,
      unregister,
      labelFor: (value) => items.get(value)?.label ?? value,
      isVisible: (value) => !listQuery.trim() || visibleValues.has(value),
      visibleCount: visible.length,
      firstMatch: visible.find((item) => !item.disabled)?.value ?? null,
      disabled,
      reduce,
      inputRef,
      triggerRef,
      anchor,
      measure,
    }),
    [
      anchor,
      disabled,
      items,
      listQuery,
      measure,
      open,
      query,
      reduce,
      register,
      remove,
      setOpen,
      setQuery,
      toggle,
      unregister,
      values,
      visible,
      visibleValues,
    ],
  );

  return (
    <MultiSelectContext.Provider value={context}>
      <View {...props} className={`w-full ${className}`}>
        {children}
      </View>
    </MultiSelectContext.Provider>
  );
}
