import { type NextRequest, NextResponse } from "next/server";
import { consumeNonce, verifyWalletSignature } from "@/lib/auth/stellar-verify";
import { createClient } from "@/lib/supabase/server";

async function deterministicPassword(walletAddress: string): Promise<string> {
  const secret = process.env.WALLET_AUTH_SECRET;
  if (!secret) throw new Error("WALLET_AUTH_SECRET env var is not set");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as any,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    new TextEncoder().encode(walletAddress) as any,
  );
  return Buffer.from(sig).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature } = body ?? {};

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "signature is required" },
        { status: 400 },
      );
    }

    // ── 2. Consume the nonce (one-time use, expires after 5 min) ────────────
    const nonce = consumeNonce(walletAddress);
    if (!nonce) {
      return NextResponse.json(
        { error: "Nonce not found or expired. Request a new nonce." },
        { status: 401 },
      );
    }

    // ── 3. Verify the signature ──────────────────────────────────────────────
    const isValid = verifyWalletSignature(walletAddress, nonce, signature);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Signature verification failed. Wallet ownership not proved.",
        },
        { status: 401 },
      );
    }

    // ── 4. Sign in / sign up via Supabase ────────────────────────────────────
    // Use a deterministic email and password keyed by the wallet address so
    // the same wallet always maps to the same Supabase user.
    const email = `${walletAddress.toLowerCase()}@wallet.anonchat.local`;
    const password = await deterministicPassword(walletAddress);

    const supabase = await createClient();

    // Try signing in first
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (!signInError && signInData.session) {
      return NextResponse.json(
        {
          session: signInData.session,
          user: signInData.user,
          walletAddress,
          isNewUser: false,
        },
        { status: 200 },
      );
    }

    // First time — create the account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            wallet_address: walletAddress,
            username: `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`,
          },
          // No email confirmation needed — wallet signature is the proof
          emailRedirectTo: undefined,
        },
      },
    );

    if (signUpError) {
      console.error("[wallet-auth] sign-up error:", signUpError.message);
      return NextResponse.json(
        { error: "Authentication failed. Please try again." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        session: signUpData.session,
        user: signUpData.user,
        walletAddress,
        isNewUser: true,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[wallet-auth] /api/auth/wallet-login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
