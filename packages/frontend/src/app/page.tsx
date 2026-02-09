import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PoolDashboard } from "@/components/PoolDashboard";
import { JoinPool } from "@/components/JoinPool";
import { ClaimSUP } from "@/components/ClaimSUP";
import { MemberList } from "@/components/MemberList";
import { ContractStatus } from "@/components/ContractStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-sm font-bold">
              8004
            </div>
            <span className="text-lg font-bold text-white">
              Agent Pool
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Earn from the
            <span className="text-emerald-400"> Agent Economy</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Register your AI agent with ERC-8004, join a Superfluid GDA pool,
            and earn continuous token streams — automatically distributed to
            every member.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="#join"
              className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Join the Pool
            </a>
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Learn about ERC-8004 ↗
            </a>
            <a
              href="https://testnet.8004scan.io/create"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Register with ERC-8004 ↗
            </a>
          </div>
        </section>

        {/* Flow */}
        <section className="pb-20">
          <h2 className="mb-10 text-center text-2xl font-bold text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FlowStep
              step="1"
              title="Register"
              description="Get an ERC-8004 identity — your on-chain agent passport with verifiable metadata."
            />
            <FlowStep
              step="2"
              title="Join Pool"
              description="Call joinPool with your Agent ID. Ownership is verified on-chain, and you receive pool units."
            />
            <FlowStep
              step="3"
              title="Earn"
              description="Streams to the GDA pool are auto-distributed to all members. Claim anytime."
            />
          </div>
          <div className="mt-6 hidden sm:flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-500 font-mono">
              <span className="text-emerald-400">register()</span>
              <span>→</span>
              <span className="text-emerald-400">joinPool(agentId)</span>
              <span>→</span>
              <span className="text-emerald-400">stream flows in</span>
              <span>→</span>
              <span className="text-emerald-400">claimSUP()</span>
            </div>
          </div>
        </section>

        {/* Contract Status Banner */}
        <ContractStatus />

        {/* Stats */}
        <section className="pb-8">
          <PoolDashboard />
        </section>

        {/* Actions */}
        <section id="join" className="pb-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <JoinPool />
            <ClaimSUP />
          </div>
        </section>

        {/* Members */}
        <section className="pb-20">
          <MemberList />
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800 py-10">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-zinc-500">
              POC on Base Sepolia — not production software
            </p>
            <div className="flex gap-6 text-sm text-zinc-500">
              <a
                href="https://eips.ethereum.org/EIPS/eip-8004"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                ERC-8004 Spec
              </a>
              <a
                href="https://docs.superfluid.finance/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                Superfluid Docs
              </a>
              <a
                href="https://github.com/erc-8004/erc-8004-contracts"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                GitHub
              </a>
              <a
                href="/llms.txt"
                className="hover:text-zinc-300 transition-colors"
              >
                llms.txt
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FlowStep({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}
