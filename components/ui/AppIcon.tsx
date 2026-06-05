import { Icon, addCollection } from "@iconify/react";
import basilIcons from "@iconify-json/basil/icons.json";
import { getIconClass } from "@/lib/icons";

if (typeof window !== "undefined") {
  addCollection(basilIcons);
}

type Props = {
  icon: string | null | undefined;
  className?: string;
  size?: number;
};

export default function AppIcon({ icon, className = "", size = 20 }: Props) {
  const resolved = getIconClass(icon);

  if (resolved.startsWith("basil:")) {
    return (
      <Icon
        icon={resolved}
        width={size}
        height={size}
        className={className}
      />
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
