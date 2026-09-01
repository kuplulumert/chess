interface StrategyPanelProps {
  strategy: string | null;
  title: string;
}

export function StrategyPanel({ strategy, title }: StrategyPanelProps) {
  if (!strategy) return null;

  return (
    <div className="info-card strategy-panel">
      <h3 className="moves-title">{title}</h3>
      <p className="strategy-text">{strategy}</p>
    </div>
  );
}
