"use client";

import { autoReconnect, connect, disconnect, getPublicKey } from "@/app/stellar-wallet-kit";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ConnectWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function showConnected() {
    try {
      const key = await getPublicKey();
      if (key) {
        setPublicKey(key);

        {/* Wallet connection toast */ }
        toast.success("Wallet connected successfully", {
          duration: 2000
        });
      } else {
        setPublicKey(null);
      }
    } catch (error) {
      console.error("Connection error:", error);

      setPublicKey(null);
    } finally {
      setLoading(false);
    }
  }

  async function showDisconnected() {
    setPublicKey(null);
    setLoading(false);
    // Clear Supabase session on disconnect
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
    }

    {/* Wallet disconnection toast */ }
    toast("Wallet disconnected successfully", {
      icon: "🔌",
      duration: 2000
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const key = await getPublicKey();
        if (key) {
          setPublicKey(key);
        }
      } catch (error) {
        console.error("Initial wallet check failed:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div id="connect-wrap" className="wrap" aria-live="polite">
      {!loading && publicKey && (
        <div className="flex gap-5">
          <div
            className="ellipsis bg-linear-to-r from-primary to-accent p-2 rounded-2xl"
            title={publicKey}
          >
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </div>
          <button
            className="bg-linear-to-r from-primary/50 to-accent/70 p-2 rounded-xl h-10 px-4 self-center"
            onClick={() => disconnect(showDisconnected)}
          >
            Disconnect
          </button>
        </div>
      )}

      {!loading && !publicKey && (
        <>
          <button
            onClick={() => connect(showConnected)}
            className="bg-linear-to-r from-primary to-accent p-2 rounded-2xl px-8"
          >
            Connect
          </button>
        </>
      )}
    </div>
  );
}
