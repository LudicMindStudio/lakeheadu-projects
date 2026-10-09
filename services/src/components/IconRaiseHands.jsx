// The raising-hands mark that leads the first-step treatment wherever the
// old "first step" label used to sit.

import { RAISE_HANDS_MARKUP } from "./raiseHandsMarkup.js";

export default function IconRaiseHands({ size = 16, className }) {
  return (
    <svg
      className={className ? `icon-raise ${className}` : "icon-raise"}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: RAISE_HANDS_MARKUP }}
    />
  );
}
