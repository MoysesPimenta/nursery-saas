# Webhooks Documentation

Webhooks allow your application to receive real-time notifications of important events happening in Nursery-SaaS. Instead of polling the API, Webhooks push data to your application when events occur.

## Overview

Webhooks are HTTP POST requests sent to your application when specific events happen. Each webhook includes:
- Event type and data
- HMAC signature for verification
- Timestamp for replay attack prevention

## Registering a Webhook

To receive webhooks, register an endpoint with your application:

```bash
curl -X POST https://api.mynurse.app/webhooks/subscribe \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "child.checked_in",
    "callback_url": "https://yourapp.com/webhooks/nursery",
    "description": "Notify when child checks in"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "webhook_id": "webhook_123",
    "event_type": "child.checked_in",
    "callback_url": "https://yourapp.com/webhooks/nursery",
    "signing_secret": "whsec_1234567890",
    "status": "active",
    "created_at": "2026-03-30T14:23:45Z"
  }
}
```

## Webhook Events

### Child-Related Events

#### child.checked_in
Fired when a child is checked in to a class.

```json
{
  "event_type": "child.checked_in",
  "event_id": "evt_123",
  "timestamp": "2026-03-30T08:15:30Z",
  "data": {
    "visit_id": "visit_456",
    "child_id": "child_789",
    "class_id": "class_001",
    "check_in_time": "2026-03-30T08:15:30Z",
    "checked_in_by": "user_100"
  }
}
```

#### child.checked_out
Fired when a child is checked out from a class.

```json
{
  "event_type": "child.checked_out",
  "event_id": "evt_124",
  "timestamp": "2026-03-30T16:00:00Z",
  "data": {
    "visit_id": "visit_456",
    "child_id": "child_789",
    "class_id": "class_001",
    "check_out_time": "2026-03-30T16:00:00Z",
    "checked_out_by": "user_100"
  }
}
```

#### child.created
Fired when a new child is created in the system.

```json
{
  "event_type": "child.created",
  "event_id": "evt_125",
  "timestamp": "2026-03-30T10:00:00Z",
  "data": {
    "child_id": "child_789",
    "tenant_id": "tenant_123",
    "first_name": "Emma",
    "last_name": "Johnson",
    "birthdate": "2021-06-15",
    "created_by": "user_100"
  }
}
```

#### child.updated
Fired when child information is updated.

```json
{
  "event_type": "child.updated",
  "event_id": "evt_126",
  "timestamp": "2026-03-30T11:00:00Z",
  "data": {
    "child_id": "child_789",
    "changes": {
      "notes": {
        "old": "Previous notes",
        "new": "Updated notes"
      }
    }
  }
}
```

#### child.deleted
Fired when a child record is deleted.

```json
{
  "event_type": "child.deleted",
  "event_id": "evt_127",
  "timestamp": "2026-03-30T12:00:00Z",
  "data": {
    "child_id": "child_789",
    "deleted_by": "user_100"
  }
}
```

### Health & Medication Events

#### medication.added
Fired when a medication is added to a child.

```json
{
  "event_type": "medication.added",
  "event_id": "evt_128",
  "timestamp": "2026-03-30T13:00:00Z",
  "data": {
    "child_id": "child_789",
    "medication_id": "med_001",
    "medication_name": "Antibiotics",
    "dosage": "5ml",
    "frequency": "twice daily"
  }
}
```

#### allergy.updated
Fired when allergy information is updated.

```json
{
  "event_type": "allergy.updated",
  "event_id": "evt_129",
  "timestamp": "2026-03-30T14:00:00Z",
  "data": {
    "child_id": "child_789",
    "allergy_id": "allergy_001",
    "allergy_name": "Peanut",
    "severity": "high",
    "reaction": "Anaphylaxis"
  }
}
```

### Attendance Events

#### visit.ended
Fired when a visit/attendance record is completed.

```json
{
  "event_type": "visit.ended",
  "event_id": "evt_130",
  "timestamp": "2026-03-30T16:00:00Z",
  "data": {
    "visit_id": "visit_456",
    "child_id": "child_789",
    "duration_minutes": 480,
    "check_in_time": "2026-03-30T08:00:00Z",
    "check_out_time": "2026-03-30T16:00:00Z"
  }
}
```

### Employee Events

#### employee.created
Fired when a new employee is added.

#### employee.updated
Fired when employee information is updated.

#### employee.deleted
Fired when an employee is removed.

### Class Events

#### class.created
Fired when a new class is created.

#### class.updated
Fired when class information is updated.

#### class.deleted
Fired when a class is removed.

## HMAC Signing & Verification

All webhooks are signed with HMAC-SHA256. This allows you to verify the webhook came from Nursery-SaaS.

### Signing Process

```
signature = HMAC-SHA256(signing_secret, event_body)
```

### Verification Example (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhook(req, signingSecret) {
  const signature = req.headers['x-nursery-signature'];
  const timestamp = req.headers['x-nursery-timestamp'];
  const body = JSON.stringify(req.body);

  // Verify timestamp is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const eventTime = parseInt(timestamp);

  if (Math.abs(now - eventTime) > 300) {
    throw new Error('Webhook timestamp is too old');
  }

  // Create signature
  const message = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(message)
    .digest('hex');

  // Compare signatures
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}

app.post('/webhooks/nursery', (req, res) => {
  try {
    verifyWebhook(req, process.env.WEBHOOK_SECRET);

    const event = req.body;

    // Handle event
    switch (event.event_type) {
      case 'child.checked_in':
        handleChildCheckedIn(event.data);
        break;
      case 'child.checked_out':
        handleChildCheckedOut(event.data);
        break;
      // ... handle other events
    }

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### Verification Example (Python)

```python
import hmac
import hashlib
import json
from datetime import datetime
from flask import request, jsonify

def verify_webhook(signature, timestamp, body, signing_secret):
    # Verify timestamp
    now = datetime.utcnow().timestamp()
    event_time = int(timestamp)

    if abs(now - event_time) > 300:
        raise ValueError('Webhook timestamp too old')

    # Create signature
    message = f"{timestamp}.{body}"
    expected_signature = hmac.new(
        signing_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures (timing-safe comparison)
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError('Invalid webhook signature')

@app.route('/webhooks/nursery', methods=['POST'])
def handle_webhook():
    try:
        signature = request.headers.get('x-nursery-signature')
        timestamp = request.headers.get('x-nursery-timestamp')
        body = request.get_data(as_text=True)

        verify_webhook(
            signature,
            timestamp,
            body,
            os.getenv('WEBHOOK_SECRET')
        )

        event = request.json

        # Handle event
        if event['event_type'] == 'child.checked_in':
            handle_child_checked_in(event['data'])
        elif event['event_type'] == 'child.checked_out':
            handle_child_checked_out(event['data'])

        return jsonify({'success': True})
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
```

## HTTP Headers

Each webhook request includes these headers:

```
X-Nursery-Event: child.checked_in
X-Nursery-Event-Id: evt_123
X-Nursery-Signature: <HMAC-SHA256 signature>
X-Nursery-Timestamp: 1690000000
X-Nursery-Delivery-Id: delivery_789
Content-Type: application/json
```

## Webhook Examples

### curl Example

```bash
curl -X POST https://yourapp.com/webhooks/nursery \
  -H "Content-Type: application/json" \
  -H "X-Nursery-Signature: abc123..." \
  -H "X-Nursery-Timestamp: 1690000000" \
  -d '{
    "event_type": "child.checked_in",
    "event_id": "evt_123",
    "timestamp": "2026-03-30T08:15:30Z",
    "data": {
      "child_id": "child_789",
      "class_id": "class_001"
    }
  }'
```

## Best Practices

### Processing Webhooks

1. **Verify the signature immediately** - Ensure the webhook came from Nursery-SaaS
2. **Check the timestamp** - Prevent replay attacks by validating the timestamp is recent
3. **Process asynchronously** - Return 200 quickly, handle the event in background
4. **Implement idempotency** - Use event_id to avoid processing duplicate webhooks
5. **Handle failures gracefully** - Implement retry logic on your end
6. **Log all webhooks** - Keep a record of received events for debugging

### Webhook Endpoint Requirements

- Must be publicly accessible HTTPS endpoint
- Must return 200 OK status within 30 seconds
- Must accept POST requests with JSON body
- Should process events asynchronously
- Should validate HMAC signatures

## Retries

Failed webhook deliveries are retried with exponential backoff:

- 1st attempt: Immediate
- 2nd attempt: 10 minutes later
- 3rd attempt: 1 hour later
- 4th attempt: 6 hours later
- 5th attempt: 24 hours later

After 5 failed attempts, the webhook is marked inactive.

## Webhook Management

### List Webhooks

```bash
curl -X GET https://api.mynurse.app/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Webhook

```bash
curl -X PUT https://api.mynurse.app/webhooks/webhook_id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_url": "https://yourapp.com/webhooks/nursery-v2"
  }'
```

### Delete Webhook

```bash
curl -X DELETE https://api.mynurse.app/webhooks/webhook_id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Redeliver Webhook

```bash
curl -X POST https://api.mynurse.app/webhooks/deliveries/delivery_id/redeliver \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Support

For webhook issues or questions:
- Email: webhooks@mynurse.app
- Documentation: https://docs.mynurse.app/webhooks
- Status: https://status.mynurse.app
