"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { WagmiProvider, useAccount, useDisconnect, useConnect, useBalance } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, DEFAULT_CHAIN } from "@/lib/wagmi";
import { isDemoSafeMode } from "@/lib/demo-safe";

// Create a single stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

interface Web3ContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: `0x${string}` | string | undefined;
  formattedAddress: string;
  balanceFormatted: string;
  chainId: number;
  chainName: string;
  isDemoSigner: boolean;
  toggleDemoSigner: (enable?: boolean) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  isConnected: false,
  isConnecting: false,
  address: undefined,
  formattedAddress: "Not Connected",
  balanceFormatted: "0.00 ETH",
  chainId: DEFAULT_CHAIN.id,
  chainName: DEFAULT_CHAIN.name,
  isDemoSigner: false,
  toggleDemoSigner: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function useWeb3() {
  return useContext(Web3Context);
}

function Web3InnerProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDemoSigner, setIsDemoSigner] = useState(false);

  const { address: realAddress, isConnected: realIsConnected, isConnecting: realIsConnecting, chainId: realChainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectAsync, connectors } = useConnect();
  const { data: realBalance } = useBalance({
    address: realAddress,
  });

  useEffect(() => {
    setMounted(true);
    if (isDemoSafeMode()) {
      setIsDemoSigner(true);
    }
  }, []);

  const toggleDemoSigner = (enable?: boolean) => {
    setIsDemoSigner((prev) => (typeof enable === "boolean" ? enable : !prev));
  };

  const connectWallet = async () => {
    try {
      const injectedConnector = connectors.find((c) => c.id === "windowEthereum" || c.id === "injected") || connectors[0];
      if (injectedConnector) {
        await connectAsync({ connector: injectedConnector, chainId: DEFAULT_CHAIN.id });
        setIsDemoSigner(false);
      } else {
        // Fallback to demo mode if no injected provider is installed
        setIsDemoSigner(true);
      }
    } catch {
      // Gracefully switch to Demo Signer mode so presentation never fails live
      setIsDemoSigner(true);
    }
  };

  const disconnectWallet = () => {
    if (realIsConnected) {
      disconnect();
    }
    setIsDemoSigner(false);
  };

  const demoAddress = "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901";
  const effectiveIsConnected = (realIsConnected && !!realAddress) || isDemoSigner;
  const effectiveAddress = (realIsConnected && realAddress) ? realAddress : (isDemoSigner ? demoAddress : undefined);

  const formattedAddress = useMemo(() => {
    if (!effectiveAddress) return "Not Connected";
    return `${effectiveAddress.slice(0, 6)}...${effectiveAddress.slice(-4)}`;
  }, [effectiveAddress]);

  const balanceFormatted = useMemo(() => {
    if (realIsConnected && realBalance) {
      const rawVal = (realBalance as any).formatted ?? (realBalance.value !== undefined ? (Number(realBalance.value) / (10 ** (realBalance.decimals || 18))).toString() : "0");
      const val = parseFloat(rawVal) || 0;
      return `${val.toFixed(3)} ${realBalance.symbol}`;
    }
    if (isDemoSigner) {
      return "14.850 ETH";
    }
    return "0.00 ETH";
  }, [realIsConnected, realBalance, isDemoSigner]);

  const value: Web3ContextType = {
    isConnected: effectiveIsConnected,
    isConnecting: realIsConnecting && !isDemoSigner,
    address: effectiveAddress,
    formattedAddress,
    balanceFormatted,
    chainId: realChainId || DEFAULT_CHAIN.id,
    chainName: DEFAULT_CHAIN.name,
    isDemoSigner,
    toggleDemoSigner,
    connectWallet,
    disconnectWallet,
  };

  if (!mounted) {
    return (
      <Web3Context.Provider
        value={{
          isConnected: false,
          isConnecting: false,
          address: undefined,
          formattedAddress: "Not Connected",
          balanceFormatted: "0.00 ETH",
          chainId: DEFAULT_CHAIN.id,
          chainName: DEFAULT_CHAIN.name,
          isDemoSigner: false,
          toggleDemoSigner: () => {},
          connectWallet: async () => {},
          disconnectWallet: () => {},
        }}
      >
        {children}
      </Web3Context.Provider>
    );
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3InnerProvider>{children}</Web3InnerProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
