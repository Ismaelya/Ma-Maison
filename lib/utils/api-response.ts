import { NextResponse } from "next/server";

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string } };

/**
 * Returns a standardized success response.
 * Section 92 Spec: { success: true, data: T, message?: string }
 */
export function apiSuccess<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

/**
 * Returns a standardized error response.
 * Section 92 Spec: { success: false, error: { code: string, message: string } }
 */
export function apiError(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}
