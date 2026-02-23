"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Users, Loader2 } from "lucide-react";
import { getPublicKey, connect } from "@/app/stellar-wallet-kit";
import { toast } from "react-hot-toast";
import { trackActivity } from "@/lib/reputation";

export function CreateGroupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkWallet() {
      const key = await getPublicKey();
      setPublicKey(key);
    }
    if (isOpen) {
      checkWallet();
    }
  }, [isOpen]);

  const handleConnect = async () => {
    try {
      await connect(async () => {
        const key = await getPublicKey();
        setPublicKey(key);
      });
    } catch (error) {
      toast.error("Failed to connect wallet");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSubmitting(true);
 
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      trackActivity(publicKey, 'group');

      const newRoom = {
        id: `room-${Date.now()}`,
        name: groupName,
        address: publicKey ? `${publicKey.slice(0, 4)} ... ${publicKey.slice(-4)}` : "Unknown",
        lastMessage: "Group created",
        lastSeen: "Just now",
        unreadCount: 0,
        status: "online"
      };

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("roomCreated", { detail: newRoom }));
      }

      toast.success(`Group "${groupName}" created successfully!`);
      setGroupName("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-lg hover:shadow-md transition-all duration-300 hover:scale-105 text-sm">
          Create Group
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/50 bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-2xl font-bold gradient-text">Create New Group</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Define a name for your new anonymous chat community.
            </Dialog.Description>
          </div>

          {!publicKey ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You need to connect your Stellar wallet to create and own a group.
              </p>
              <button
                onClick={handleConnect}
                className="px-8 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateGroup} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">
                  Group Name
                </label>
                <input
                  id="name"
                  placeholder="e.g. Shadow Explorers"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </form>
          )}

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
