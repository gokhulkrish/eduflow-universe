import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getCurrentIsMobile = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getCurrentIsMobile());

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(getCurrentIsMobile());
    };
    mql.addEventListener("change", onChange);
    setIsMobile(getCurrentIsMobile());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
