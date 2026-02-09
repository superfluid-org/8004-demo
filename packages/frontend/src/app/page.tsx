import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PoolDashboard } from "@/components/PoolDashboard";
import { JoinPool } from "@/components/JoinPool";
import { ClaimSUP } from "@/components/ClaimSUP";
import { MemberList } from "@/components/MemberList";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-lg font-bold text-white">
          ERC-8004 <span className="text-emerald-400">Agent Pool</span>
        </h1>
        <ConnectButton />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <PoolDashboard />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <JoinPool />
          <ClaimSUP />
        </div>
        <MemberList />
      </main>
    </div>
  );
}
