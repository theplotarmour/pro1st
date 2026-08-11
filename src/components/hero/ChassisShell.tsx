interface ChassisShellProps {
  width: number;
  height: number;
  /** Full front-to-back depth; faces sit at ±depth/2. */
  depth: number;
  /** Fades the shell in with the assembly. */
  faceAttr?: string;
  gridSize?: number;
}

/**
 * The five non-front faces of a PRO1st chassis: two extruded heat-sink
 * flanks, a vented top, a base, and a ported back plate.
 * Shared by the hero unit and the exploded MX-1600 build.
 */
export function ChassisShell({
  width,
  height,
  depth,
  faceAttr,
  gridSize = 38,
}: ChassisShellProps) {
  const half = depth / 2;
  const faceProps = faceAttr ? { "data-p1-face": "" } : {};
  const hidden = { backfaceVisibility: "hidden" as const };
  const ventStripes =
    "repeating-linear-gradient(90deg,rgba(230,230,230,.09) 0 1px,transparent 1px 8px)";

  return (
    <>
      {/* Left flank */}
      <div
        {...faceProps}
        className="absolute left-1/2 top-0 border border-hairline"
        style={{
          width: depth,
          height,
          marginLeft: -half,
          transform: `translateX(${-width / 2}px) rotateY(-90deg)`,
          background: "linear-gradient(90deg,#101114,#2A2D33 45%,#16171A)",
          opacity: faceAttr ? 0 : 1,
          ...hidden,
        }}
      >
        <div className="absolute inset-0" style={{ background: ventStripes }} />
      </div>

      {/* Right flank */}
      <div
        {...faceProps}
        className="absolute left-1/2 top-0 border border-hairline"
        style={{
          width: depth,
          height,
          marginLeft: -half,
          transform: `translateX(${width / 2}px) rotateY(90deg)`,
          background: "linear-gradient(90deg,#16171A,#2A2D33 55%,#101114)",
          opacity: faceAttr ? 0 : 1,
          ...hidden,
        }}
      >
        <div className="absolute inset-0" style={{ background: ventStripes }} />
      </div>

      {/* Vented top */}
      <div
        {...faceProps}
        className="absolute left-0 top-1/2 border border-hairline bg-[#16171A]"
        style={{
          width,
          height: depth,
          marginTop: -half,
          transform: `translateY(${-height / 2}px) rotateX(90deg)`,
          opacity: faceAttr ? 0 : 1,
          ...hidden,
        }}
      >
        <div
          className="absolute"
          style={{
            inset: `${depth * 0.15}px ${width * 0.15}px`,
            background:
              "repeating-linear-gradient(90deg,rgba(230,230,230,.14) 0 2px,transparent 2px 11px)",
          }}
        />
      </div>

      {/* Base */}
      <div
        {...faceProps}
        className="absolute left-0 top-1/2 border border-hairline bg-[#0F1013]"
        style={{
          width,
          height: depth,
          marginTop: -half,
          transform: `translateY(${height / 2}px) rotateX(-90deg)`,
          opacity: faceAttr ? 0 : 1,
          ...hidden,
        }}
      />

      {/* Back plate with terminal cut-outs */}
      <div
        {...faceProps}
        className="absolute inset-0 border border-hairline bg-[#101114]"
        style={{
          transform: `translateZ(${-half}px) rotateY(180deg)`,
          opacity: faceAttr ? 0 : 1,
          ...hidden,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--p1-hairline) 1px,transparent 1px),linear-gradient(90deg,var(--p1-hairline) 1px,transparent 1px)",
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
        <div
          className="absolute top-1/2 border border-sig-40"
          style={{ left: gridSize, marginTop: -8, width: 72, height: 16 }}
        />
        <div
          className="absolute top-1/2 border border-sig-40"
          style={{ right: gridSize, marginTop: -8, width: 72, height: 16 }}
        />
      </div>
    </>
  );
}
