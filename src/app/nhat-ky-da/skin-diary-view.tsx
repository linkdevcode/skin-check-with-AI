"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { uploadSkinImageAction } from "@/actions/upload-skin-image";
import { createSkinDiaryEntryAction } from "@/actions/skin-diary";
import type { SkinEntryListItem } from "@/types/skin-diary";
import { aggregateWeeklyImprovement } from "@/lib/skin-diary-chart";
import { SkinImprovementChart } from "@/app/components/skin-improvement-chart";
import { cn } from "@/lib/utils";

function dayGroupKey(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

type Props = {
  initialEntries: SkinEntryListItem[];
};

export function SkinDiaryView({ initialEntries }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const chartData = useMemo(
    () =>
      aggregateWeeklyImprovement(
        initialEntries.map((e) => ({
          createdAt: new Date(e.createdAt),
          analysisResult: e.analysisResult,
        })),
      ),
    [initialEntries],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SkinEntryListItem[]>();
    for (const e of initialEntries) {
      const k = dayGroupKey(e.createdAt);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [initialEntries]);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await uploadSkinImageAction(fd);
      if (!up.ok) {
        setMsg(up.error);
        return;
      }
      startTransition(async () => {
        const cr = await createSkinDiaryEntryAction({
          imageUrl: up.url,
          userNote: note.trim() || null,
        });
        if (!cr.ok) {
          setMsg(cr.error);
          return;
        }
        setNote("");
        router.refresh();
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#141820]/90">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Thêm ảnh mới</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          Ảnh JPEG/PNG/WebP, tối đa 8MB. Ảnh mới sẽ được so với ảnh gần nhất (AI Vision).
        </p>
        <label className="mt-3 block text-xs font-medium text-slate-600 dark:text-zinc-400">
          Ghi chú (tuỳ chọn)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: sau tuần dùng BHA…"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-white"
        />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
        <button
          type="button"
          onClick={onPickFile}
          disabled={uploading || pending}
          className={cn(
            "mt-4 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-500",
            "disabled:opacity-50",
          )}
        >
          {uploading || pending ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-5 w-5" aria-hidden />
          )}
          Chụp hoặc chọn ảnh, lưu nhật ký
        </button>
        {msg ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
            {msg}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Xu hướng cải thiện
        </h2>
        <SkinImprovementChart data={chartData} />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          Ảnh theo ngày
        </h2>
        {grouped.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-zinc-500">Chưa có ảnh nào. Thêm ảnh đầu tiên ở trên.</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([dayLabel, items]) => (
              <div key={dayLabel}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400/90">
                  {dayLabel}
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" role="list">
                  {items.map((it) => (
                    <li key={it.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/60">
                      <Link href={`/nhat-ky-da/${it.id}`} className="block aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:opacity-95"
                          loading="lazy"
                        />
                      </Link>
                      {it.analysisResult.comparedWithEntryId ? (
                        <Link
                          href={`/nhat-ky-da/so-sanh?before=${it.analysisResult.comparedWithEntryId}&after=${it.id}`}
                          className="absolute bottom-1 right-1 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
                        >
                          So sánh
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
