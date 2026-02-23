import { type NextRequest, NextResponse } from "next/server";
import { generateNonce } from "@/lib/auth/stellar-verify";

/**
 * POST /api/auth/nonce
 * Body: { walletAddress: string }
 *
 * Returns a one-time nonce the client must sign with their Stellar wallet.
 * The nonce is stored server-side and expires in 5 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body ?? {};

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    // Basic Stellar public key sanity check (56 chars, starts with G)
    if (walletAddress.length !== 56 || !walletAddress.startsWith("G")) {
      return NextResponse.json(
        { error: "Invalid Stellar wallet address" },
        { status: 400 },
      );
    }

    const nonce = generateNonce(walletAddress);

    return NextResponse.json({ nonce }, { status: 200 });
  } catch (err) {
    console.error("[wallet-auth] /api/auth/nonce error:", err);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 },
    );
  }
}
