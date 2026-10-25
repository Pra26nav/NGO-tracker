import { http, createConfig } from "wagmi";
import { baseSepolia, polygonAmoy, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors/injected";

export const wagmiConfig = createConfig({
  chains: [baseSepolia, polygonAmoy, sepolia],
  connectors: [
    injected({
      target() {
        return {
          id: "windowEthereum",
          name: "Injected Wallet",
          provider: typeof window !== "undefined" ? (window as any).ethereum : undefined,
        };
      },
    }),
  ],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
    [sepolia.id]: http("https://rpc.sepolia.org"),
  },
  ssr: true,
});

export const DEFAULT_CHAIN = baseSepolia;
