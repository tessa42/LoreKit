import { NextResponse } from 'next/server'

export type ApiSuccess<T> = { ok: true; data: T }
export type ApiError = { ok: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccess<T>, { status })
}

export function apiError(error: string, code?: string, status = 400) {
  return NextResponse.json({ ok: false, error, code } satisfies ApiError, { status })
}
