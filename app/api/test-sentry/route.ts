import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de test Sentry — Désactivé en production pour des raisons de sécurité.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Endpoint de test Sentry désactivé en environnement de production." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: "development_only",
    message: "Endpoint de test Sentry actif uniquement en environnement de développement.",
  });
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Endpoint de test Sentry désactivé en environnement de production." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: "development_only",
    message: "Endpoint de test Sentry actif uniquement en environnement de développement.",
  });
}
