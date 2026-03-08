# n8n Workflow Architecture

## Workflow 1: Excel Upload Processing
Triggered via webhook from backend after file upload.

```
[Webhook: POST /n8n/process-upload]
    │
    ▼
[HTTP Request: GET /api/batches/:id/shipments]
    │
    ▼
[SplitInBatches: iterate rows]
    │
    ▼
[Function: normalize carrier name]
    │
    ▼
[HTTP Request: PUT /api/shipments/:id (update carrier_normalized)]
    │
    ▼
[HTTP Request: PATCH /api/batches/:id status=completed]
```

## Workflow 2: Daily Tracking Scheduler
Runs on cron, fetches active shipments, triggers tracking in staggered batches.

```
[Cron Trigger: daily at 12:00]
    │
    ▼
[HTTP Request: GET /api/shipments?is_active=true]
    │
    ▼
[SplitInBatches: batch_size=5]
    │
    ▼
[Wait: 30 seconds between batches]  ← rate limiting
    │
    ▼
[HTTP Request: POST /api/tracking/check  { shipment_id }]
    │
    ▼
[IF: check_status == "failed"]
    ├─ YES → [HTTP Request: POST /api/tracking/retry { shipment_id, attempt: 1 }]
    └─ NO  → continue
```

## Workflow 3: Tracking Executor
Called per-shipment by the scheduler. Delegates to backend tracking service.

```
[Webhook: POST /n8n/track-shipment]
    │
    ▼
[HTTP Request: POST /api/tracking/execute { shipment_id }]
    │
    ▼
[IF: response.shipment_status IN (arrived, delivered, completed)]
    ├─ YES → [HTTP Request: PATCH /api/shipments/:id { is_active: false }]
    └─ NO  → [NoOp]
```

## Workflow 4: Retry Handler
Handles failed tracking with exponential backoff.

```
[Webhook: POST /n8n/retry-tracking]
    │
    ▼
[IF: attempt <= 3]
    ├─ YES → [Wait: attempt * 60 seconds]
    │            │
    │            ▼
    │        [HTTP Request: POST /api/tracking/execute { shipment_id }]
    │            │
    │            ▼
    │        [IF: still failed]
    │            ├─ YES → [HTTP Request: POST /n8n/retry-tracking { attempt+1 }]
    │            └─ NO  → done
    └─ NO  → [HTTP Request: PATCH /api/shipments/:id { check_status: "failed" }]
```

## Key Design Decisions

1. **n8n handles orchestration, backend handles logic** — n8n schedules and sequences; actual tracking/parsing lives in the Node.js backend.
2. **Staggered execution** — SplitInBatches + Wait nodes prevent carrier rate limiting.
3. **Retry with backoff** — Separate retry workflow with attempt counter.
4. **Monitoring termination** — Inline check after each tracking call; sets is_active=false when done.
