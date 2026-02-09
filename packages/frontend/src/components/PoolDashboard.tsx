"use client";

export function PoolDashboard() {
  // TODO: Read pool state (total units, flow rate, member count)
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Stream Rate" value="-- SUP/mo" />
      <StatCard label="Pool Members" value="--" />
      <StatCard label="Your Share" value="-- SUP/mo" />
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
