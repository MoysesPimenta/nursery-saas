import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/v1/webhooks
 * Handles incoming webhooks (e.g., from Supabase database events)
 * Expects HMAC-SHA256 signature verification in X-Webhook-Signature header
 */

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.text();
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Require webhook secret to be configured
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify HMAC signature
    const isValid = verifyWebhookSignature(signature, body, webhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse and process webhook payload
    const payload = JSON.parse(body);

    return NextResponse.json(
      {
        message: 'Webhook processed successfully',
        received: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Helper function to verify webhook signature (HMAC-SHA256)
 * @param signature - The signature from X-Webhook-Signature header
 * @param body - The raw request body
 * @param secret - The webhook signing secret
 * @returns true if signature is valid, false otherwise
 */
function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false;

  try {
    const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
  } catch (error) {
    // Return false on any timing comparison errors
    return false;
  }
}
