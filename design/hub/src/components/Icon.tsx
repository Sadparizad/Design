import { icons, type IconName } from "./icons.ts";

interface IconProps {
  name: IconName;
  className?: string;
}

/** A decorative icon. Put the meaning in the label of the control that holds it. */
export function Icon({ name, className }: IconProps) {
  const { src, size } = icons[name];
  return <img src={src} width={size} height={size} alt="" aria-hidden="true" className={className} />;
}
