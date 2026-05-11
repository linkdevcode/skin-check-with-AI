"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/components/ui/motion-spring";
import { triggerHaptic } from "@/components/ui/haptic";

export type ProductRow = { id: string; text: string };

function newRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function rowsFromStrings(items: string[]): ProductRow[] {
  return items.map((text) => ({ id: newRowId(), text }));
}

export function stringsFromRows(rows: ProductRow[]): string[] {
  return rows.map((r) => r.text.trim()).filter(Boolean);
}

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { type: "spring" as const, stiffness: 400, damping: 32 } },
};

type SectionProps = {
  title: string;
  badge: string;
  rows: ProductRow[];
  onChange: (rows: ProductRow[]) => void;
  disabled?: boolean;
};

function ProductSection({ title, badge, rows, onChange, disabled }: SectionProps) {
  const updateText = (id: string, text: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const remove = (id: string) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) window.navigator.vibrate(10);
    onChange(rows.filter((r) => r.id !== id));
  };

  const add = () => {
    triggerHaptic(10);
    onChange([...rows, { id: newRowId(), text: "" }]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800/90 dark:bg-[#141820]/70 dark:shadow-none dark:ring-zinc-800/50">
      <div className="mb-2 flex items-center justify-between gap-2 border-l-4 border-teal-500 pl-2 dark:border-teal-500/90">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400/90">{title}</h3>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-800/80 dark:text-zinc-400">
          {badge}
        </span>
      </div>
      <motion.ul className="space-y-2" role="list" variants={listVariants} initial="hidden" animate="show">
        <AnimatePresence mode="popLayout">
          {rows.map((row) => (
            <motion.li
              key={row.id}
              layout
              variants={rowVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="overflow-hidden"
            >
              <motion.div
                className="flex items-stretch gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 ring-1 ring-inset ring-slate-200/80 dark:border-zinc-800 dark:bg-black/25 dark:ring-zinc-800/40"
                whileTap={{ backgroundColor: "rgba(45, 212, 191, 0.12)" }}
                transition={springSnappy}
              >
                <input
                  type="text"
                  value={row.text}
                  onChange={(e) => updateText(row.id, e.target.value)}
                  disabled={disabled}
                  placeholder="Tên sản phẩm / bước"
                  className={cn(
                    "sk-input-focus-ring min-h-10 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-900",
                    "placeholder:text-slate-400 focus:border-teal-500/40 dark:focus:border-teal-400/35",
                    "dark:text-zinc-100 dark:placeholder:text-zinc-600",
                    "disabled:opacity-50",
                  )}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  disabled={disabled}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-zinc-700/80 dark:text-zinc-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 disabled:opacity-40"
                  aria-label="Xóa dòng"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </motion.div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="mt-2 flex w-full min-h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition-colors hover:border-teal-400/80 hover:text-teal-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-teal-700/60 dark:hover:text-teal-400"
      >
        <Plus className="h-4 w-4" />
        Thêm bước
      </button>
    </div>
  );
}

type RoutineProductListsProps = {
  morningRows: ProductRow[];
  eveningRows: ProductRow[];
  onMorningChange: (rows: ProductRow[]) => void;
  onEveningChange: (rows: ProductRow[]) => void;
  disabled?: boolean;
};

export function RoutineProductLists({
  morningRows,
  eveningRows,
  onMorningChange,
  onEveningChange,
  disabled,
}: RoutineProductListsProps) {
  return (
    <div className="space-y-3">
      <ProductSection
        title="Buổi sáng"
        badge="AM"
        rows={morningRows}
        onChange={onMorningChange}
        disabled={disabled}
      />
      <ProductSection
        title="Buổi tối"
        badge="PM"
        rows={eveningRows}
        onChange={onEveningChange}
        disabled={disabled}
      />
    </div>
  );
}
