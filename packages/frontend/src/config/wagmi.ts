import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";
import { IS_DEV_MODE } from "./contracts";

const chains = IS_DEV_MODE ? [base, baseSepolia] as const : [base] as const;

export const config = getDefaultConfig({
  appName: "ERC-8004 Agent Pool",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "PLACEHOLDER",
  chains,
  ssr: true,
});
