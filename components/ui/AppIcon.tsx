import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { getIconClass } from "@/lib/icons";

type Props = {
  icon: string | null | undefined;
  className?: string;
  size?: number;
};

export default function AppIcon({ icon, className = "", size = 20 }: Props) {
  const resolved = getIconClass(icon);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    if (!spanRef.current || !resolved.startsWith("basil:")) return;
    const el = spanRef.current;
    if (el.querySelector("svg")?.querySelector("path, circle, rect, polygon, line")) {
      setFailed(false);
    } else {
      setFailed(true);
    }
  }, [resolved]);

  if (resolved.startsWith("basil:")) {
    return (
      <span
        ref={spanRef}
        className={className}
        style={{ display: "inline-flex", alignItems: "center", minWidth: size, minHeight: size }}
      >
        {failed ? (
          <span style={{ fontSize: `${size * 0.8}px`, lineHeight: 1, opacity: 0.3 }}>
            □
          </span>
        ) : (
          <Icon icon={resolved} width={size} height={size} />
        )}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    >
      {resolved}
    </span>
  );
}
