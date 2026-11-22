import { icons, type IconDef, type IconName } from "./icons.ts";

interface IconProps {
  name: IconName;
  className?: string;
}

/** A decorative icon. Put the meaning in the label of the control that holds it. */
export function Icon({ name, className }: IconProps) {
  const def: IconDef = icons[name];
  const { src, size } = def;
  return (
    <img
      src={src}
      width={def.width ?? size}
      height={def.height ?? size}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
