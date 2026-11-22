import arrowCircleDown from "../assets/icons/arrow-circle-down.svg";
import battery from "../assets/icons/battery.svg";
import calendarBlank from "../assets/icons/calendar-blank.svg";
import deviceMobileCamera from "../assets/icons/device-mobile-camera.svg";
import divider from "../assets/icons/divider.svg";
import desktop from "../assets/icons/desktop.svg";
import exportIcon from "../assets/icons/export.svg";
import play from "../assets/icons/play.svg";
import plus from "../assets/icons/plus.svg";
import signal from "../assets/icons/signal.svg";
import textAlignLeft from "../assets/icons/text-align-left.svg";
import trafficLights from "../assets/icons/traffic-lights.svg";
import userCircle from "../assets/icons/user-circle.svg";
import wifi from "../assets/icons/wifi.svg";
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

export interface IconDef {
  src: string;
  /** The width and height in the file's root <svg>. */
  size: number;
  /** Only for a file that is not square: its own width and height. */
  width?: number;
  height?: number;
}

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
  userCircle: { src: userCircle, size: 20 },
  calendarBlank: { src: calendarBlank, size: 20 },
  textAlignLeft: { src: textAlignLeft, size: 20 },
  play: { src: play, size: 20 },
  deviceMobileCamera: { src: deviceMobileCamera, size: 20 },
  desktop: { src: desktop, size: 20 },
  // The vertical rule between metadata items: 1px wide, 16px tall.
  divider: { src: divider, size: 16, width: 1, height: 16 },
  // The device frames' status bars.
  signal: { src: signal, size: 14.4, width: 14.4, height: 11.2 },
  wifi: { src: wifi, size: 14.4, width: 14.4, height: 11.2 },
  battery: { src: battery, size: 22.4, width: 22.4, height: 11.2 },
  trafficLights: { src: trafficLights, size: 41.6, width: 41.6, height: 9.6 },
  arrowCircleDown: { src: arrowCircleDown, size: 16 },
  export: { src: exportIcon, size: 16 },
  plus: { src: plus, size: 16 },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
