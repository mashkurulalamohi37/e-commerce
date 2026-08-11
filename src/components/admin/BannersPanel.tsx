import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, Trash2, Upload } from "lucide-react";
import {
  createBanner,
  deleteBanner,
  listAdminBanners,
  reorderBanners,
  updateBanner,
  uploadBannerImage,
  type Banner,
} from "@/lib/banner-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { cn } from "@/lib/utils";

const EMPTY = {
  placement: "hero" as Banner["placement"],
  kicker: "",
  title: "",
  subtitle: "",
  ctaLabel: "Shop now",
  ctaHref: "/offers",
  imageUrl: "",
  alt: "",
  tone: "dark" as Banner["tone"],
  active: true,
  startsAt: "" as string,
  endsAt: "" as string,
};

/** ISO -> value for <input type="datetime-local"> in the admin's local time. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function scheduleLabel(b: Banner) {
  const now = Date.now();
  if (!b.active) return { text: "Hidden", tone: "muted" as const };
  if (b.startsAt && new Date(b.startsAt).getTime() > now)
    return { text: `Scheduled · ${new Date(b.startsAt).toLocaleString()}`, tone: "warn" as const };
  if (b.endsAt && new Date(b.endsAt).getTime() <= now)
    return { text: "Expired", tone: "muted" as const };
  return {
    text: b.endsAt ? `Live until ${new Date(b.endsAt).toLocaleString()}` : "Live",
    tone: "ok" as const,
  };
}

function ImagePicker({
  value,
  onChange,
  label = "Slide image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => uploadBannerImage(file),
    onSuccess: (res) => {
      onChange(res.url);
      toast.success("Image uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            width={120}
            height={80}
            loading="lazy"
            className="h-14 w-20 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="grid h-14 w-20 shrink-0 place-items-center rounded-md bg-muted text-[10px] text-muted-foreground">
            No image
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1 size-4" />
          {upload.isPending ? "Uploading…" : "Choose image"}
        </Button>
      </div>
    </div>
  );
}

export function BannersPanel() {
  const qc = useQueryClient();
  const banners = useQuery({ queryKey: ["admin", "banners"], queryFn: listAdminBanners });
  const [draft, setDraft] = useState(EMPTY);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const create = useMutation({
    mutationFn: () =>
      createBanner({
        ...draft,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: fromLocalInput(draft.endsAt),
      }),
    onSuccess: () => {
      toast.success("Slide added");
      setDraft(EMPTY);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hero = (banners.data ?? []).filter((b) => b.placement === "hero");
  const offers = (banners.data ?? []).filter((b) => b.placement === "offer");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h2 className="section-title">Add a slide</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Placement
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={draft.placement}
              onChange={(e) =>
                setDraft({ ...draft, placement: e.target.value as Banner["placement"] })
              }
            >
              <option value="hero">Hero carousel</option>
              <option value="offer">Offer banners</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Text tone
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={draft.tone}
              onChange={(e) => setDraft({ ...draft, tone: e.target.value as Banner["tone"] })}
            >
              <option value="dark">Light text on dark overlay</option>
              <option value="light">Dark text on light overlay</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Kicker
            <Input
              value={draft.kicker}
              onChange={(e) => setDraft({ ...draft, kicker: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Title
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Subtitle
            <Input
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Button label
            <Input
              value={draft.ctaLabel}
              onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Link
            <Input
              value={draft.ctaHref}
              onChange={(e) => setDraft({ ...draft, ctaHref: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Alt text (required)
            <Input
              value={draft.alt}
              placeholder="Describe the image for screen readers"
              onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Publish from (optional)
            <Input
              type="datetime-local"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium">
            Unpublish at (optional)
            <Input
              type="datetime-local"
              value={draft.endsAt}
              onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <ImagePicker
              value={draft.imageUrl}
              onChange={(url) => setDraft({ ...draft, imageUrl: url })}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="mt-3"
          disabled={create.isPending || !draft.title || !draft.alt || !draft.imageUrl}
          onClick={() => create.mutate()}
        >
          Add slide
        </Button>
      </div>

      {banners.isLoading && <p className="text-sm text-muted-foreground">Loading slides…</p>}

      <BannerGroup title="Hero carousel" placement="hero" items={hero} onChanged={invalidate} />
      <BannerGroup title="Offer banners" placement="offer" items={offers} onChanged={invalidate} />
    </div>
  );
}

function BannerGroup({
  title,
  placement,
  items,
  onChanged,
}: {
  title: string;
  placement: Banner["placement"];
  items: Banner[];
  onChanged: () => void;
}) {
  const [order, setOrder] = useState<Banner[]>(items);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => setOrder(items), [items]);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderBanners(placement, ids),
    onSuccess: () => {
      toast.success("Order saved");
      onChanged();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      onChanged();
    },
  });

  const moveTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const next = [...order];
    const from = next.findIndex((b) => b.id === fromId);
    const to = next.findIndex((b) => b.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
  };

  const moveByKeyboard = (id: string, delta: number) => {
    const index = order.findIndex((b) => b.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setOrder(next);
    reorder.mutate(next.map((b) => b.id));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        <span className="text-xs text-muted-foreground">Drag the handle to reorder</span>
      </div>
      <div className="space-y-2">
        {order.length === 0 && <p className="text-sm text-muted-foreground">No slides yet.</p>}
        {order.map((banner) => (
          <div
            key={banner.id}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId) moveTo(dragId, banner.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragId(null);
              reorder.mutate(order.map((b) => b.id));
            }}
            className={cn("transition-opacity", dragId === banner.id && "opacity-60")}
          >
            <BannerRow
              banner={banner}
              onChanged={onChanged}
              onDragStart={() => setDragId(banner.id)}
              onDragEnd={() => setDragId(null)}
              onKeyboardMove={(delta) => moveByKeyboard(banner.id, delta)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerRow({
  banner,
  onChanged,
  onDragStart,
  onDragEnd,
  onKeyboardMove,
}: {
  banner: Banner;
  onChanged: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onKeyboardMove: (delta: number) => void;
}) {
  const [draft, setDraft] = useState({
    ...banner,
    startsAt: toLocalInput(banner.startsAt),
    endsAt: toLocalInput(banner.endsAt),
  });

  useEffect(() => {
    setDraft({
      ...banner,
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
    });
  }, [banner]);

  const status = scheduleLabel(banner);

  const save = useMutation({
    mutationFn: () =>
      updateBanner(banner.id, {
        placement: banner.placement,
        kicker: draft.kicker,
        title: draft.title,
        subtitle: draft.subtitle,
        ctaLabel: draft.ctaLabel,
        ctaHref: draft.ctaHref,
        imageUrl: draft.imageUrl,
        alt: draft.alt,
        tone: draft.tone,
        active: draft.active,
        sortOrder: banner.sortOrder,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: fromLocalInput(draft.endsAt),
      }),
    onSuccess: () => {
      toast.success("Slide saved");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteBanner(banner.id),
    onSuccess: () => {
      toast.success("Slide removed");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-xl border border-border bg-card p-3 shadow-card"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Reorder ${banner.title}. Use arrow up or down keys.`}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onKeyboardMove(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onKeyboardMove(1);
            }
          }}
          className="mt-1 cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                status.tone === "ok" && "bg-primary/15 text-link",
                status.tone === "warn" && "bg-accent text-accent-foreground",
                status.tone === "muted" && "bg-muted text-muted-foreground",
              )}
            >
              {status.text}
            </span>
          </div>
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <Input
            value={draft.subtitle}
            placeholder="Subtitle"
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          />
          <Input
            value={draft.alt}
            placeholder="Alt text"
            onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-[11px] font-medium text-muted-foreground">
              Publish from
              <Input
                type="datetime-local"
                value={draft.startsAt}
                onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
              />
            </label>
            <label className="text-[11px] font-medium text-muted-foreground">
              Unpublish at
              <Input
                type="datetime-local"
                value={draft.endsAt}
                onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
              />
            </label>
          </div>
          <ImagePicker
            value={draft.imageUrl}
            label="Replace image"
            onChange={(url) => setDraft({ ...draft, imageUrl: url })}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={draft.active}
            onCheckedChange={(v) => setDraft({ ...draft, active: v })}
          />
          Live
        </label>
        <label className="flex items-center gap-2 text-xs">
          Tone
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={draft.tone}
            onChange={(e) => setDraft({ ...draft, tone: e.target.value as Banner["tone"] })}
          >
            <option value="dark">Dark overlay</option>
            <option value="light">Light overlay</option>
          </select>
        </label>
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
          Save
        </Button>
        <ConfirmDelete
          itemName={banner.title || "this slide"}
          description="The slide will be removed from the storefront immediately. This cannot be undone."
          onConfirm={() => remove.mutate()}
          disabled={remove.isPending}
        >
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={remove.isPending}
          >
            <Trash2 className="mr-1 size-4" /> Delete
          </Button>
        </ConfirmDelete>
      </div>
    </div>
  );
}
