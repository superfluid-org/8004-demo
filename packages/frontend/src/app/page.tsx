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
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-sm font-bold ring-1 ring-emerald-500/20">
              8004
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-tight">
                Agent Pool
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                Superfluid × ERC-8004
              </span>
            </div>
          </div>
          <ConnectButton showBalance={false} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="hero-glow relative py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live on Base Sepolia
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Earn from the
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Agent Economy
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Register your AI agent with ERC-8004, join a Superfluid Distribution Pool,
            and earn continuous token streams — automatically distributed to
            every member.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#join"
              className="rounded-lg bg-emerald-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Join the Pool
            </a>
            <a
              href="https://testnet.8004scan.io/create"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-7 py-3 font-medium text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-600/10"
            >
              Register Agent ↗
            </a>
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700/50 px-7 py-3 font-medium text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-300"
            >
              ERC-8004 Spec ↗
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc2rlaeH31rZpJ_RFNL7egxi9fYTEUjW9r2kwkhd2pMae2dog/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700/50 px-7 py-3 font-medium text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-300"
            >
              Contact Us ↗
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section id="join" className="scroll-mt-20 pb-24">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Three steps
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
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
              description="Streams to the Distribution Pool are auto-distributed to all members. Claim anytime."
            />
          </div>
          <div className="mt-8 hidden sm:flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-full border border-zinc-800/50 bg-zinc-900/30 px-5 py-2.5 text-xs font-mono">
              <span className="text-emerald-400">register()</span>
              <span className="text-zinc-600">→</span>
              <span className="text-emerald-400">joinPool(agentId)</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-500">stream flows in</span>
              <span className="text-zinc-600">→</span>
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
        <section className="pb-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <JoinPool />
            <ClaimSUP />
          </div>
        </section>

        {/* Members */}
        <section className="pb-24">
          <MemberList />
        </section>

        {/* Next Steps */}
        <section className="pb-24">
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Build with us
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
            What Will You Ship?
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-center text-base leading-relaxed text-zinc-400">
            Build apps that combine ERC-8004 agent identity with Superfluid
            money streams — and get funded with{" "}
            <span className="font-semibold text-emerald-400">SUP grants</span>.
          </p>
          <div className="mx-auto mb-12 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-5 py-2 text-sm text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ideas ready to build — pick one and start shipping
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NextStepCard
              emoji="⭐"
              title="Reputation-Weighted Earnings"
              description="Agents with better track records earn more. Pool units scale with on-chain reputation scores — merit-based distribution, fully automated."
              tag="High Impact"
            />
            <NextStepCard
              emoji="🛡️"
              title="Validation-Gated Access"
              description="Not just any agent gets in. Require on-chain validation from trusted verifiers before an agent can join and start earning."
              tag="High Impact"
            />
            <NextStepCard
              emoji="🏗️"
              title="Tiered Multi-Pool"
              description="Multiple pools with different criteria, tokens, and rates. General, Verified, Premium — agents can earn from several pools at once."
            />
            <NextStepCard
              emoji="🔑"
              title="Metadata-Driven Distribution"
              description="Use on-chain agent metadata — skills, capabilities, service endpoints — to dynamically determine who earns what."
              tag="Quick Win"
            />
            <NextStepCard
              emoji="💸"
              title="Direct Agent-to-Agent Streams"
              description="Beyond pools: continuous payment streams between agents. Coordinators pay specialists, clients stream to providers — real-time."
            />
            <NextStepCard
              emoji="🔄"
              title="Fee Redistribution"
              description="Join fees recycled back to pool members as Super Tokens. Early participants benefit from network growth, reputation unlocks discounts."
            />
            <NextStepCard
              emoji="🏛️"
              title="Agent DAOs & Guilds"
              description="Agents form on-chain collectives. DAOs manage pool membership, guilds negotiate terms — governance meets the agent economy."
            />
            <NextStepCard
              emoji="⚡"
              title="Event-Driven Bounties"
              description="Instant distributions triggered by task completion, milestones, or protocol revenue. Not just streams — lump-sum rewards too."
              tag="Quick Win"
            />
            <NextStepCard
              emoji="🔒"
              title="Staking & Slashing"
              description="Agents stake tokens to earn. Poor performance detected by validators reduces earnings and redistributes stake to good actors."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                8004
              </div>
              <p className="text-sm text-zinc-500">
                Proof of concept on Base Sepolia
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <a
                href="https://eips.ethereum.org/EIPS/eip-8004"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                ERC-8004
              </a>
              <a
                href="https://docs.superfluid.finance/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                Superfluid
              </a>
              <a
                href="https://github.com/0xPilou/poc-8004-sf"
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

function NextStepCard({
  emoji,
  title,
  description,
  tag,
}: {
  emoji: string;
  title: string;
  description: string;
  tag?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-900/80 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-xl ring-1 ring-emerald-500/20 transition-all duration-300 group-hover:bg-emerald-500/15 group-hover:ring-emerald-500/30">
            {emoji}
          </div>
          {tag && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-white group-hover:text-emerald-50 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors">
          {description}
        </p>
      </div>
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
    <div className="card-hover rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold ring-1 ring-emerald-500/20">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
