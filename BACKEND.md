# Fanju backend

## Next API backend

Run locally:

```bash
pnpm install
pnpm dev
```

Check:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dinners
curl http://localhost:3000/api/channels
curl http://localhost:3000/api/tools
```

Create dinner:

```bash
curl -X POST http://localhost:3000/api/dinners \
  -H 'content-type: application/json' \
  -d '{"title":"深圳周末小桌","city":"深圳","area":"南山","type":"周末饭局","date":"2026-06-06","time":"19:30","seats":8}'
```

Create seat request:

```bash
curl -X POST http://localhost:3000/api/seat \
  -H 'content-type: application/json' \
  -d '{"table":"demo-table","displayName":"Demo","message":"想参加"}'
```

## Modal backend

Install and login:

```bash
pip install modal
modal setup
```

Serve:

```bash
pnpm modal:serve
```

Deploy:

```bash
pnpm modal:deploy
```

Modal routes:

```text
/health
/dinners
/dinners/{slug}
/seat
/channels
```

## Frontend routes using backend

```text
/create -> POST /api/dinners
/invite -> POST /api/seat
/market -> GET /api/dinners
/ops -> GET /api/health, /api/dinners, /api/channels, /api/tools
```
