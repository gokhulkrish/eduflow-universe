import { useFlashNews, type FlashNewsSeverity } from "@/stores/flashNews";

const SEVERITY_STYLES: Record<FlashNewsSeverity, { bg: string; text: string; dot: string }> = {
  info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  critical: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

export function FlashNewsBar() {
  const items = useFlashNews((s) => s.items);
  const settings = useFlashNews((s) => s.settings);

  if (!settings.enabled) return null;

  const now = Date.now();
  const active = items.filter((item) => {
    const from = new Date(item.liveFrom).getTime();
    if (now < from) return false;
    if (item.liveUntil && now > new Date(item.liveUntil).getTime()) return false;
    return true;
  });
  if (!active.length) return null;

  const containerClass = settings.position === "bottom"
    ? "border-t border-border/40"
    : "border-b border-border/40";

  const barClass = settings.style === "emphasized"
    ? "h-10 text-sm"
    : "h-8 text-xs";

  return (
    <div className={`relative w-full overflow-hidden ${containerClass} ${barClass}`}>
      <div className="flex h-full animate-[flash-scroll_30s_linear_infinite] gap-12 whitespace-nowrap pl-8">
        {[...active, ...active].map((item, i) => {
          const style = SEVERITY_STYLES[item.severity];
          return (
            <div
              key={`${item.id}-${i}`}
              className={`group relative flex items-center gap-2 ${style.text} ${style.bg} rounded-md px-3`}
              title={item.message || item.title}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot} shrink-0`} />
              <span className="font-medium">{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
