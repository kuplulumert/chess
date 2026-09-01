import { useEffect, useRef, useState } from "react";

const FLASH_DURATION_MS = 550;

interface MovePurposeProps {
  comment: string | null;
  moveIndex: number;
}

export function MovePurpose({ comment, moveIndex }: MovePurposeProps) {
  const [flashing, setFlashing] = useState(false);
  const prevIndexRef = useRef(moveIndex);

  useEffect(() => {
    // Only flash when a move actually advanced the line, not on a reset back to 0.
    if (moveIndex > prevIndexRef.current) {
      setFlashing(true);
      const timer = window.setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
      prevIndexRef.current = moveIndex;
      return () => window.clearTimeout(timer);
    }
    // A reset (or any non-advancing change) cancels the effect above via its cleanup,
    // which clears the pending timer without clearing `flashing` itself — force it off
    // here so a restart mid-flash can't leave the background stuck highlighted.
    setFlashing(false);
    prevIndexRef.current = moveIndex;
  }, [moveIndex]);

  if (!comment) return null;

  return (
    <div className={"info-card move-purpose" + (flashing ? " move-purpose-flash" : "")}>
      <h3 className="moves-title">Why this move</h3>
      <p className="move-purpose-text">{comment}</p>
    </div>
  );
}
