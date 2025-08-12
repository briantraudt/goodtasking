import * as React from "react";

// Tailwind breakpoints reference: md=768, lg=1024, xl=1280

export function useIsTabletOrBelow() {
  const [isTabletOrBelow, setIsTabletOrBelow] = React.useState<boolean>(false);

  React.useEffect(() => {
    const query = "(max-width: 1023px)"; // < lg
    const mql = window.matchMedia(query);
    const onChange = () => setIsTabletOrBelow(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTabletOrBelow;
}
