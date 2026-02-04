// API to get Dodo product IDs for pricing page
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    solo: {
      monthly: (process.env.DODO_SOLO_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_SOLO_PRODUCT_ID || '').trim(),
      annual: (process.env.DODO_SOLO_ANNUAL_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_SOLO_ANNUAL_PRODUCT_ID || '').trim() || null,
    },
    team: {
      monthly: (process.env.DODO_TEAM_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_TEAM_PRODUCT_ID || '').trim(),
      annual: (process.env.DODO_TEAM_ANNUAL_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_TEAM_ANNUAL_PRODUCT_ID || '').trim() || null,
    },
  });
}
