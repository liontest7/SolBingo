"use client"

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export default function WalletConnectButton() {
  return (
    <>
      <WalletMultiButton className="wallet-adapter-button" />

      {/* Custom styling for the wallet button */}
      <style jsx global>{`
        .wallet-adapter-button {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          height: 2.5rem;
          padding: 0 1rem;
          border-radius: 0.375rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .wallet-adapter-button:hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .wallet-adapter-button:not([disabled]):hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .wallet-adapter-modal-wrapper {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 0.5rem;
        }
        .wallet-adapter-modal-button-close {
          background-color: hsl(var(--secondary));
        }
        .wallet-adapter-modal-title {
          color: hsl(var(--foreground));
        }
      `}</style>
    </>
  )
}
