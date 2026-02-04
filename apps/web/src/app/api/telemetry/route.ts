import { NextResponse } from "next/server";

interface TelemetryPayload {
  type?: string;
  payload?: Record<string, unknown>;
  at?: string;
  route?: string;
  userAgent?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelemetryPayload;

    if (!body?.type || !body.payload) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const record = {
      ...body,
      receivedAt: new Date().toISOString(),
    };

    console.info("[telemetry]", JSON.stringify(record));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telemetry] failed to parse payload", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
