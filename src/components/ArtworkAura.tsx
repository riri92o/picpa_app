import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

export function ArtworkAura({
  colors,
  source,
  frame,
}: {
  colors: [string, string, string];
  source?: string;
  frame: RefObject<HTMLDivElement | null>;
}) {
  const [box, setBox] = useState<CSSProperties | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = frame.current ?? anchor.current?.parentElement;
    const image = host?.querySelector<HTMLImageElement>(
      ".exported-collage-image img",
    );
    if (!host || !image || !source) {
      setBox(null);
      return;
    }
    const measure = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const ratio = Math.min(
        host.clientWidth / image.naturalWidth,
        host.clientHeight / image.naturalHeight,
      );
      const width = image.naturalWidth * ratio,
        height = image.naturalHeight * ratio;
      setBox({
        left: (host.clientWidth - width) / 2,
        top: (host.clientHeight - height) / 2,
        width,
        height,
      });
    };
    measure();
    image.addEventListener("load", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => {
      observer.disconnect();
      image.removeEventListener("load", measure);
    };
  }, [source, frame]);
  return (
    <div
      ref={anchor}
      className="artwork-aura"
      aria-hidden="true"
      hidden={!box}
      style={{ ...box, ...auraColors(colors) }}
    >
      <div className="artwork-aura-fields" key={colors.join("")}>
        <span className="artwork-aura-field aura-sage" />
        <span className="artwork-aura-field aura-olive" />
        <span className="artwork-aura-field aura-pearl" />
      </div>
      <svg
        className="artwork-aura-contour"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path d="M6 14 C16-9 34 8 55 2 S105 4 99 27 S94 56 103 74 S78 112 58 100 S25 113 6 96 S-4 62 1 44 S-1 28 6 14Z" />
      </svg>
    </div>
  );
}

export function auraColors(colors: [string, string, string]): CSSProperties {
  return {
    "--artwork-color-1": colors[0],
    "--artwork-color-2": colors[1],
    "--artwork-color-3": colors[2],
  } as CSSProperties;
}

export function ArtworkColorSignature({
  colors,
}: {
  colors: [string, string, string];
}) {
  return (
    <svg
      className="artwork-color-signature"
      viewBox="0 0 120 12"
      aria-hidden="true"
      style={auraColors(colors)}
    >
      <path d="M2 8 C11 8 18 1 29 3" />
      <path d="M46 8 C55 6 61 2 73 3" />
      <path d="M90 7 C99 4 108 1 118 3" />
    </svg>
  );
}
