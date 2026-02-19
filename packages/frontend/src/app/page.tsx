import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PoolDashboard } from "@/components/PoolDashboard";
import { JoinPool } from "@/components/JoinPool";
import { ClaimSUP } from "@/components/ClaimSUP";
import { MemberList } from "@/components/MemberList";
import { ContractStatus } from "@/components/ContractStatus";

function ERC8004Logo({ className = "h-5" }: { className?: string }) {
  return (
    <img
      src="/8004-logo.png"
      alt="8004"
      className={`${className} brightness-0 invert`}
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <div className="mx-auto max-w-5xl">
          {/* Mobile: logo centered, wallet below */}
          <div className="flex items-center justify-between sm:hidden">
            <div className="flex items-center gap-2.5">
              <ERC8004Logo className="h-4" />
              <span className="text-base text-zinc-500">×</span>
              <img src="/superfluid-logo.svg" alt="Superfluid" className="h-5" />
            </div>
            <ConnectButton showBalance={false} />
          </div>
          {/* Desktop: full navbar */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="https://docs.superfluid.org/docs/concepts/superfluid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Superfluid Docs
              </a>
              <a
                href="https://github.com/0xPilou/poc-8004-sf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfdxN7dGchn4CNQAF9bJDA4PMWH8D8q3lc_kI4ytddkZ2fsjQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <ERC8004Logo className="h-5" />
              <span className="text-lg text-zinc-500">×</span>
              <img src="/superfluid-logo.svg" alt="Superfluid" className="h-6" />
            </div>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero */}
        <section className="hero-glow relative py-16 text-center sm:py-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live on Base Sepolia
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
            Agents Earn SUP.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Every Second.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Register your AI agent with ERC-8004, join a Superfluid Distribution
            Pool, and earn automatically distributed stream of SUP.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#join"
              className="w-48 text-center rounded-lg bg-emerald-600 px-7 py-3 font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Join the Pool
            </a>
            <a
              href="https://testnet.8004scan.io/create"
              target="_blank"
              rel="noopener noreferrer"
              className="w-48 text-center rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-7 py-3 font-medium text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-600/10"
            >
              Register Agent ↗
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="pb-24 sm:pb-40">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Three steps
          </p>
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FlowStep
              step="1"
              title="Register"
              description="Get an ERC-8004 agent ID."
            />
            <FlowStep
              step="2"
              title="Join Pool"
              description="Connect your agent to a Superfluid Distribution Pool. Ownership is verified automatically."
            />
            <FlowStep
              step="3"
              title="Earn"
              description="Just like that SUP streams to your wallet. And you can claim it anytime."
            />
          </div>
        </section>

        {/* Start Earning */}
        <section id="join" className="scroll-mt-20 pb-24 sm:pb-40">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Join the Pool
          </p>
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            Start Earning
          </h2>

          {/* Contract Status Banner */}
          <ContractStatus />

          {/* Stats */}
          <div className="mt-6">
            <PoolDashboard />
          </div>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <JoinPool />
            <ClaimSUP />
          </div>
        </section>

        {/* Next Steps */}
        <section className="pb-24 sm:pb-40">
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Build with us
          </p>
          <h2 className="mb-4 text-center text-2xl font-bold text-white sm:text-3xl">
            Ideas Worth Shipping
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
              description="Agents with better track records earn more. Pool units scale with onchain reputation scores for merit-based, fully automated distribution."
              tag="High Impact"
            />
            <NextStepCard
              emoji="🛡️"
              title="Validation-Gated Access"
              description="Not just any agent gets in. Require onchain validation from trusted verifiers before an agent can join and start earning."
              tag="High Impact"
            />
            <NextStepCard
              emoji="🏗️"
              title="Tiered Multi-Pool"
              description="Multiple pools with different criteria, tokens, and rates. General, Verified, Premium. Agents can earn from several pools at once."
            />
            <NextStepCard
              emoji="🔑"
              title="Metadata-Driven Distribution"
              description="Use onchain agent metadata like skills, capabilities, and service endpoints to dynamically determine who earns what."
              tag="Quick Win"
            />
            <NextStepCard
              emoji="💸"
              title="Direct Agent-to-Agent Streams"
              description="Beyond pools: continuous payment streams between agents. Coordinators pay specialists, clients stream to providers in real-time."
            />
            <NextStepCard
              emoji="🔄"
              title="Fee Redistribution"
              description="Join fees recycled back to pool members as Super Tokens. Early participants benefit from network growth, reputation unlocks discounts."
            />
            <NextStepCard
              emoji="🏛️"
              title="Agent DAOs & Guilds"
              description="Agents form onchain collectives. DAOs manage pool membership, guilds negotiate terms. Governance meets the agent economy."
            />
            <NextStepCard
              emoji="⚡"
              title="Event-Driven Bounties"
              description="Instant distributions triggered by task completion, milestones, or protocol revenue. Not just streams, lump-sum rewards too."
              tag="Quick Win"
            />
            <NextStepCard
              emoji="🔒"
              title="Staking & Slashing"
              description="Agents stake tokens to earn. Poor performance detected by validators reduces earnings and redistributes stake to good actors."
            />
          </div>
        </section>

        {/* Infrastructure CTA */}
        <section id="infrastructure" className="scroll-mt-20 pb-24 sm:pb-40">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-emerald-400/60">
            Infrastructure
          </p>
          <h2 className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl">
            Better Rails for the Agent Economy
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed text-zinc-400">
            The agent economy needs better rails.{" "}
            <span className="text-zinc-300">Superfluid Distribution Pools</span>{" "}
            distribute streams at scale.{" "}
            <span className="text-zinc-300">ERC-8004</span> gives agents
            identity. We give you the infrastructure to ship.
          </p>
          <div className="flex justify-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfdxN7dGchn4CNQAF9bJDA4PMWH8D8q3lc_kI4ytddkZ2fsjQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 px-8 py-3 font-medium text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-600/10"
            >
              Contact Us →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-zinc-400">
                  ERC-8004
                </span>
                <span className="text-sm text-zinc-600">×</span>
                <img
                  src="/superfluid-logo.svg"
                  alt="Superfluid"
                  className="h-4 opacity-50"
                />
              </div>
              <p className="text-xs text-zinc-600">
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
