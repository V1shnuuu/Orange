import { NextResponse } from 'next/server';

/**
 * Accepts in-app feedback and forwards it to a webhook.
 *
 * There is no database in this project, so the destination is configured per
 * deployment via FEEDBACK_WEBHOOK_URL — a Discord/Slack incoming webhook or
 * any endpoint that accepts a JSON POST. Without it the route reports that
 * feedback is not being stored rather than silently dropping the submission,
 * which is what the previous console.log did.
 */

const MAX_MESSAGE_LENGTH = 2000;

export interface FeedbackPayload {
  message: string;
  /** Connected wallet, when the sender had one. */
  wallet?: string;
  /** Page the feedback was sent from. */
  path?: string;
}

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  let body: FeedbackPayload;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body must be JSON.');
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return badRequest('Feedback message is required.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return badRequest(`Feedback must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const entry = {
    message,
    wallet: typeof body.wallet === 'string' ? body.wallet : null,
    path: typeof body.path === 'string' ? body.path : null,
    receivedAt: new Date().toISOString(),
  };

  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) {
    // Say so plainly. Reporting success here would recreate the original bug
    // in a more convincing disguise.
    console.warn('[feedback] FEEDBACK_WEBHOOK_URL is not set; feedback was not stored', entry);
    return NextResponse.json(
      { ok: false, error: 'Feedback storage is not configured on this deployment.' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**CirclePact feedback**\n${entry.message}\n\nWallet: ${
          entry.wallet ?? 'not connected'
        }\nPage: ${entry.path ?? 'unknown'}\nAt: ${entry.receivedAt}`,
        ...entry,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded ${response.status}`);
    }
  } catch (error) {
    console.error('[feedback] delivery failed', error);
    return NextResponse.json(
      { ok: false, error: 'Could not deliver feedback. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
