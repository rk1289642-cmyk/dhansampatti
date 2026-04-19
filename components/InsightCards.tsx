interface Card { label: string; value: number | string; icon: React.ReactNode; colorClass: string; }

export default function InsightCards({ cards }: { cards: Card[] }) {
  return (
    <div className="insights-grid">
      {cards.map((c, i) => (
        <div key={i} className="card insight-card">
          <div className={`ic-icon ${c.colorClass}`}>{c.icon}</div>
          <div className="ic-label">{c.label}</div>
          <div className="ic-value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
