import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";

const SELECTED_WALLET_ID = "selectedWalletId";
const WALLET_CONNECTED = "walletConnected";

function getSelectedWalletId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_WALLET_ID);
}

function isWalletConnected() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WALLET_CONNECTED) === "true";
}

function clearWalletStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SELECTED_WALLET_ID);
  localStorage.removeItem(WALLET_CONNECTED);
}

let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (kit) return kit;

  if (typeof window === "undefined") {
    // Return a proxy or dummy object for SSR if needed, 
    // but here we just ensure functions check for window.
    throw new Error("StellarWalletsKit should only be used in the browser");
  }

  kit = new StellarWalletsKit({
    modules: allowAllModules(),
    network: WalletNetwork.PUBLIC,
    selectedWalletId: getSelectedWalletId() ?? FREIGHTER_ID,
  });

  return kit;
}

export async function signTransaction(...args: any[]) {
  const kitInstance = getKit();
  // @ts-ignore
  return kitInstance.signTransaction(...args);
}

export async function getPublicKey() {
  if (typeof window === "undefined") return null;
  if (!getSelectedWalletId() || !isWalletConnected()) return null;
  const kitInstance = getKit();
  const { address } = await kitInstance.getAddress();
  return address;
}

export async function autoReconnect() {
  if (!isWalletConnected() || !getSelectedWalletId()) return null;

  try {
    return await getPublicKey();
  } catch {
    clearWalletStorage();
    return null;
  }
}

export async function setWallet(walletId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SELECTED_WALLET_ID, walletId);
    localStorage.setItem(WALLET_CONNECTED, "true");
    const kitInstance = getKit();
    kitInstance.setWallet(walletId);
  }
}

export async function disconnect(callback?: () => Promise<void>) {
  if (typeof window !== "undefined") {
    clearWalletStorage();
    const kitInstance = getKit();
    kitInstance.disconnect();
    if (callback) await callback();
  }
}

export async function connect(callback?: () => Promise<void>) {
  if (typeof window === "undefined") return;
  const kitInstance = getKit();
  await kitInstance.openModal({
    onWalletSelected: async (option) => {
      try {
        await setWallet(option.id);
        if (callback) await callback();
      } catch (e) {
        console.error(e);
      }
      return option.id;
    },
  });
}
