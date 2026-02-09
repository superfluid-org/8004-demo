"use client";

import { useAccount } from "wagmi";

export function ClaimSUP() {
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Claim SUP</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Claim your accumulated SUP tokens. A small ETH fee is required.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Accumulated</p>
          <p className="text-xl font-semibold text-emerald-400">-- SUP</p>
        </div>
        <div>
          <p className="text-right text-sm text-zinc-400">Claim fee</p>
          <p className="text-right text-sm text-zinc-300">0.001 ETH</p>
        </div>
      </div>
      <button className="mt-4 w-full rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-500">
        Claim
      </button>
    </section>
  );
}
