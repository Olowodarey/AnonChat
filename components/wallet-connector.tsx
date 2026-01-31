"use client";

import { connect, disconnect, getPublicKey } from "@/app/stellar-wallet-kit";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ConnectWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function showConnected() {
    const key = await getPublicKey();
    if (key) {
      setPublicKey(key);

      // Wallet connection toast
      toast.success("Wallet connected successfully", {
        duration: 2000
      });
    } else {
      setPublicKey(null);
    }
    setLoading(false);
  }

  async function showDisconnected() {
    setPublicKey(null);
    setLoading(false);
    
    // Wallet disconnection toast
    toast("Wallet disconnected successfully", {
      icon: "🔌",
      duration: 2000
    });
  }

  async function handleConnect() {
    try {
      await connect(showConnected);
    } catch (error: any) {
      console.error("Connection error:", error);
      
      // Show error toast based on the error
      if (error?.message?.includes("not selected") || error?.message?.includes("cancelled")) {
        toast.error("Connection cancelled. Please select an account.", {
          duration: 3000
        });
      } else if (error?.message?.includes("No wallet")) {
        toast.error("No Stellar wallet found. Please install Freighter or Albedo.", {
          duration: 4000
        });
      } else {
        toast.error("Failed to connect wallet. Please try again.", {
          duration: 3000
        });
      }
    }
  }

  useEffect(() => {
    (async () => {
      const key = await getPublicKey();
      if (key) {
        setPublicKey(key);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div id="connect-wrap" className="wrap" aria-live="polite">
      {!loading && publicKey && (
        <div className="flex gap-5">
          <div
            className="bg-black p-2 rounded-2xl"
            title={publicKey}
          >
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </div>
          <button
            className="bg-black p-2 rounded-xl hover:bg-black/80 transition-colors"
            onClick={() => disconnect(showDisconnected)}
          >
            Disconnect
          </button>
        </div>
      )}

      {!loading && !publicKey && (
        <>
          <button
            onClick={handleConnect}
            className="bg-black p-2 rounded-2xl px-8 hover:bg-black/80 transition-colors"
          >
            Connect
          </button>
        </>
      )}
    </div>
  );
}