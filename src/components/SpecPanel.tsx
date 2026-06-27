type SpecPanelProps = {
  spec: string;
  onSpecChange: (value: string) => void;
};

export function SpecPanel({ spec, onSpecChange }: SpecPanelProps) {
  return (
    <section className="spec-panel" aria-label="Live spec">
      <div className="section-heading">
        <span>Live Spec</span>
        <small>Alt+Shift+Space / Alt+Shift+C</small>
      </div>
      <textarea
        value={spec}
        onChange={(event) => onSpecChange(event.target.value)}
        placeholder="Write acceptance notes, UI details, edge cases..."
        aria-label="Live spec notes"
      />
    </section>
  );
}
