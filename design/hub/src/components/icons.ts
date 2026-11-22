import arrowLeft from "../assets/icons/arrow-left.svg";
import arrowRight from "../assets/icons/arrow-right.svg";
import arrowRightBrand from "../assets/icons/arrow-right-brand.svg";
import caretDown from "../assets/icons/caret-down.svg";
import caretDownTertiary from "../assets/icons/caret-down-tertiary.svg";
import claudeLooking from "../assets/icons/claude-looking.svg";
import codeSimple from "../assets/icons/code-simple.svg";
import dotBlue from "../assets/icons/dot-blue.svg";
import dotCyan from "../assets/icons/dot-cyan.svg";
import dotYellow from "../assets/icons/dot-yellow.svg";
import eye from "../assets/icons/eye.svg";
import funnelSimple from "../assets/icons/funnel-simple.svg";
import logo from "../assets/icons/logo.svg";
import magnifyingGlass from "../assets/icons/magnifying-glass.svg";

/** Every icon is a file downloaded from Figma. `size` is the width and height in its root <svg>. */
export const icons = {
  arrowLeft: { src: arrowLeft, size: 16 },
  arrowRight: { src: arrowRight, size: 24 },
  arrowRightBrand: { src: arrowRightBrand, size: 24 },
  caretDown: { src: caretDown, size: 20 },
  caretDownTertiary: { src: caretDownTertiary, size: 20 },
  claudeLooking: { src: claudeLooking, size: 52 },
  codeSimple: { src: codeSimple, size: 20 },
  dotBlue: { src: dotBlue, size: 20 },
  dotCyan: { src: dotCyan, size: 20 },
  dotYellow: { src: dotYellow, size: 20 },
  eye: { src: eye, size: 20 },
  funnelSimple: { src: funnelSimple, size: 20 },
  logo: { src: logo, size: 24 },
  magnifyingGlass: { src: magnifyingGlass, size: 20 },
} as const;

export type IconName = keyof typeof icons;
