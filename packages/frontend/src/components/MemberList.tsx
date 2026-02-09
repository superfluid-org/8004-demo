"use client";

export function MemberList() {
  // TODO: Fetch pool members from events / subgraph
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Pool Members</h2>
      <p className="mt-2 text-sm text-zinc-500">
        No members yet. Agents can join by calling joinPool with their ERC-8004
        Agent ID.
      </p>
    </section>
  );
}
