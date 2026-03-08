# MVP Development Roadmap

## Phase 1: Foundation (Days 1–3)
- [x] Define folder structure
- [x] Define database schema
- [ ] Initialize Node.js backend (Express + TypeScript)
- [ ] Set up PostgreSQL with Docker
- [ ] Run initial migration
- [ ] Implement config/env loading
- [ ] Seed admin user (bcrypt-hashed password)
- [ ] Set up Docker Compose (postgres + n8n + backend)

## Phase 2: Auth & API Shell (Days 4–5)
- [ ] Implement auth service (login, JWT generation, password verify)
- [ ] Auth middleware (JWT verification)
- [ ] Protected route wrapper
- [ ] API routes: POST /auth/login, GET /auth/me
- [ ] Basic error handling middleware

## Phase 3: Excel Upload (Days 6–8)
- [ ] File upload endpoint (multer)
- [ ] Excel parser service (xlsx library)
- [ ] Flexible column mapping (fuzzy match on headers)
- [ ] Carrier name normalization (lookup table)
- [ ] Create upload_batch + shipment records
- [ ] API routes: POST /upload, GET /batches, GET /batches/:id

## Phase 4: Tracking Service (Days 9–13)
- [ ] Carrier adapter interface (TypeScript interface)
- [ ] Implement first adapter: MSC
- [ ] Implement second adapter: Maersk
- [ ] Tracking orchestrator service
- [ ] ETA comparison + eta_history logging
- [ ] Tracking log recording
- [ ] API routes: POST /tracking/execute, GET /shipments/:id/tracking-log

## Phase 5: n8n Workflows (Days 14–16)
- [ ] Set up n8n in Docker Compose
- [ ] Build daily scheduler workflow
- [ ] Build tracking executor workflow
- [ ] Build retry handler workflow
- [ ] Test end-to-end flow with mock adapter
- [ ] Configure webhook URLs via env vars

## Phase 6: Frontend (Days 17–22)
- [ ] Initialize React app (Vite + TypeScript + Tailwind)
- [ ] Login page
- [ ] Dashboard layout (sidebar + header)
- [ ] Shipment table (filterable, sortable)
- [ ] Status badges (color-coded)
- [ ] ETA change indicators (highlight changed ETAs)
- [ ] Excel upload page with drag-and-drop
- [ ] Shipment detail view (tracking log, ETA history)
- [ ] API service layer (axios + interceptors)

## Phase 7: Integration & Polish (Days 23–25)
- [ ] End-to-end testing (upload → track → status update)
- [ ] Error handling polish
- [ ] Logging (winston/pino)
- [ ] Environment-based configuration
- [ ] Docker Compose production profile
- [ ] Basic rate limiting on API

## Phase 8: Deploy (Days 26–28)
- [ ] VPS provisioning
- [ ] Docker Compose deployment
- [ ] Nginx reverse proxy + SSL (Let's Encrypt)
- [ ] n8n behind auth or internal network
- [ ] Backup strategy for PostgreSQL
- [ ] Monitoring basics (health endpoint)

---

## API Endpoint Summary

| Method | Path                              | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | /api/auth/login                   | Login, returns JWT             |
| GET    | /api/auth/me                      | Current user info              |
| POST   | /api/upload                       | Upload Excel file              |
| GET    | /api/batches                      | List upload batches            |
| GET    | /api/batches/:id                  | Batch detail + shipments       |
| GET    | /api/shipments                    | List shipments (filter/sort)   |
| GET    | /api/shipments/:id                | Shipment detail                |
| PATCH  | /api/shipments/:id                | Update shipment                |
| POST   | /api/tracking/execute             | Run tracking for one shipment  |
| GET    | /api/shipments/:id/tracking-log   | Tracking audit log             |
| GET    | /api/shipments/:id/eta-history    | ETA change history             |
| GET    | /api/dashboard/stats              | Summary stats for dashboard    |

## Carrier Adapter Interface (pseudocode)

```typescript
interface TrackingResult {
  shipmentStatus: 'in_transit' | 'arrived' | 'delivered' | 'unknown';
  eta: Date | null;
  lastUpdate: Date | null;
  rawResponse: object;
}

interface CarrierAdapter {
  carrierKey: string;           // e.g. 'msc', 'maersk'
  track(mbl: string): Promise<TrackingResult>;
}
```

## Carrier Normalization Table

| Input variations                        | Normalized key |
|-----------------------------------------|----------------|
| MSC, Mediterranean Shipping             | msc            |
| Maersk, MAERSK LINE                     | maersk         |
| CMA CGM, CMA-CGM                       | cma_cgm        |
| Hapag-Lloyd, HAPAG LLOYD               | hapag_lloyd    |
| Evergreen, EVERGREEN LINE              | evergreen      |
| COSCO, COSCO SHIPPING                  | cosco          |
| ONE, Ocean Network Express             | one            |
| Yang Ming, YANG MING LINE              | yang_ming      |
| ZIM, ZIM LINE                          | zim            |
| HMM, Hyundai Merchant Marine           | hmm            |
