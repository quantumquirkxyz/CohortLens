import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

/**
 * Wallet connection for the prototype: injected connector (MetaMask etc.).
 * Contracts are not deployed yet (Fase 4 deferred the testnet deploy), so the
 * chain selection here is just for wallet compatibility.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});
