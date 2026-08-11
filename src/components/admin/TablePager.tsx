import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 25;

/**
 * The admin tables rendered every row. At a few hundred records that is a very
 * long scroll on a phone and a slow first paint.
 */
export function TablePager({
  page,
  total,
  onPage,
  label,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
  label: string;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) return null;

  const from = page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <p className="text-muted-foreground tabular-nums" aria-live="polite">
        {from}–{to} of {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="compact"
          variant="outline"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="px-2 tabular-nums text-muted-foreground">
          Page {page + 1} of {pages}
        </span>
        <Button
          size="compact"
          variant="outline"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
