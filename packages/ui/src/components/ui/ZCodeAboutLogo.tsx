import yuCodeLogoUrl from "@/assets/yu-code-logo.svg";
import { cn } from "@/components/lib/utils.js";

export function ZCodeAboutLogo({ className }: { className?: string }) {
  return (
    <img
      src={yuCodeLogoUrl}
      alt=""
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      draggable={false}
    />
  );
}

// 保留历史导出名以兼容现有调用方，但统一复用 yuCode 品牌资源，避免内部页面回退到旧 SVG。
export function ZCodeWordmarkLogo({ className }: { className?: string }) {
  return (
    <img
      src={yuCodeLogoUrl}
      alt=""
      className={cn("shrink-0 object-contain", className)}
      aria-hidden="true"
      draggable={false}
    />
  );
}
