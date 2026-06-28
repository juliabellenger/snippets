export default function DashboardCard({
  title,
  loading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  loading: boolean;
  error?: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border-[1.5px] border-gold/30 bg-cream-light p-4">
      <h2 className="font-heading text-xs tracking-[0.2em] text-slate-light uppercase mb-3">
        {title}
      </h2>
      {loading ? (
        <p className="text-slate-light/50 text-sm italic">Loading...</p>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : isEmpty ? (
        <p className="text-slate-light/50 text-sm italic">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}
