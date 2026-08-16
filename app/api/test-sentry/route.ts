import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint de test Sentry en production.
 * GET /api/test-sentry?trigger=error
 * POST /api/test-sentry avec {"trigger": "error", "password": "SuperSecretPassword123!", "token": "bearer-secret-token"}
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const trigger = url.searchParams.get("trigger");

  if (trigger === "error") {
    throw new Error("Sentry Test Error: Dynamic GET request server exception");
  }

  return NextResponse.json({
    status: "ready",
    instruction: "Appelez POST /api/test-sentry avec payload invalide pour tester Sentry & scrubbing",
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // If JSON parsing fails, intentional throw
    throw new Error("Sentry Test Error: Invalid JSON body received");
  }

  if (body.trigger === "error" || body.invalid === true) {
    // Intentionally throw unhandled exception with sensitive keys in scope to test default scrubbing
    const sensitiveData = {
      password: body.password || "UserSecretPassword123!",
      authToken: body.token || "Bearer secret_auth_token_xyz999",
      creditCard: "4111-2222-3333-4444",
    };

    throw new Error(
      `Sentry Test Error (Production): Unhandled API server exception for user payload [Keys: ${Object.keys(
        sensitiveData
      ).join(", ")}]`
    );
  }

  return NextResponse.json({ status: "received", body });
}
