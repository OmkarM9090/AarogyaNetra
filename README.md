# AarogyaNetra

**AI-assisted early screening** for Diabetes, Hypertension and Anemia — a
React Native mobile app backed by a FastAPI + MongoDB API that runs your
trained machine-learning models (scikit-learn / XGBoost / YOLO + MobileNetV2).

> ## ⚕️ Medical disclaimer
>
> AarogyaNetra is an **educational screening tool**. It is **not a medical
> diagnosis**. Please consult a qualified healthcare professional for proper
> evaluation and treatment.

---

## 1. Architecture

```
┌────────────────────────────┐        ┌──────────────────────────────────────────┐
│  React Native (TypeScript) │  HTTPS │  FastAPI  app.main:app                   │
│                            │◄──────►│                                          │
│  src/features/             │ JSON + │  /api/v1                                 │
│   ├─ auth        (JWT)     │ JWT    │   ├─ /auth        register·login·refresh │
│   ├─ dashboard                      │   ├─ /scans       diabetes·hypertension  │
│   ├─ scanner     (camera)           │   │                ·anemia (multipart)   │
│   ├─ prediction  (results)          │   ├─ /predictions list·detail·summary    │
│   ├─ risk-evolution (DREM)          │   ├─ /health      status·models          │
│   ├─ lifestyle-sim  (What-If)       │   └─ /health/records CRUD                │
│   ├─ history                                 │                                │
│   └─ settings                                 ▼                                │
│  src/shared/                                            ┌────────────────────┐  │
│   (api client, stores, i18n,                             │ Motor (async)      │  │
│    theme, types, services)                               │ MongoDB            │  │
└────────────────────────────┘                             │  aarogya_netra     │  │
                                                           │  users · scans     │  │
        ┌─────────────────────────────┐                    │  predictions       │  │
        │  On-device (labeled         │                    │  health_records    │  │
        │  simulations only):         │                    │  eye_images        │  │
        │  • DREM trajectory engine   │                    └────────────────────┘  │
        │  • What-If lifestyle engine │                    ┌────────────────────┐  │
        └─────────────────────────────┘                    │ ModelRegistry (ML) │  │
                                                           │  diabetes  GBC pkl │  │
                                                           │  hypertns  XGB pkl │  │
                                                           │  anemia   YOLO+MNV2│  │
                                                           └────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Real ML on the server; the app is a thin client.** All prediction math
happens in the backend. The only on-device simulation is the clearly labeled
*What-If Simulation* (lifestyle) and the *Risk Evolution* (DREM) projection,
both of which operate on your **real** stored prediction results.

---

## 2. Repository layout

```
aarogyanetra/
├── mobile/                     # React Native + TypeScript app
│   ├── src/
│   │   ├── app/                # App entry, navigation, providers
│   │   ├── features/           # auth · dashboard · scanner · prediction
│   │   │                       # risk-evolution · lifestyle-sim · history · settings
│   │   └── shared/             # types · constants · utils · services ·
│   │                           # hooks · i18n (en/hi/mr) · theme · store · components
│   ├── __tests__/              # Jest + React Native Testing Library
│   ├── .env.development        # API_BASE_URL (Android emulator → 10.0.2.2)
│   └── .env.production
├── backend/                    # FastAPI service
│   ├── app/
│   │   ├── api/v1/             # routers: auth, scans, predictions, health
│   │   ├── core/               # config, security, database, envelope,
│   │   │                       # JSON logging, rate limiting
│   │   ├── ml/                 # model_loader (+sklearn _loss shim),
│   │   │                       # ModelRegistry, predictors, feature maps
│   │   ├── schemas/            # Pydantic v2 (strict clinical ranges)
│   │   └── services/           # auth, scan orchestration, recommendations
│   ├── ml_models/              # diabetes/ · hypertension/ · anemia/
│   ├── scripts/validate_models.py
│   ├── tests/                  # pytest (mongomock-motor)
│   ├── requirements.txt        # + requirements-dev.txt
│   └── Dockerfile
├── docs/PROJECT_DOCUMENTATION.md
└── docker-compose.yml          # mongo:7 + backend (+ mongo-express profile)
```

---

## 3. Prerequisites

| Tool        | Version            | Notes                              |
|-------------|--------------------|------------------------------------|
| Python      | 3.11               | backend                            |
| Node.js     | ≥ 20               | mobile                             |
| MongoDB     | 7.x                | local or via docker compose        |
| Docker      | ≥ 24               | for the containerized stack        |
| RN CLI /    | latest             | `npx react-native`                 |
| Xcode / AS  | current            | iOS / Android simulator            |

---

## 4. Backend setup (local)

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt          # includes torch/TF? see note
cp .env.example .env                          # set JWT_SECRET_KEY!

# Validate the shipped models (prints ✅ per model)
python scripts/validate_models.py

# Run
uvicorn app.main:app --reload                 # http://localhost:8000
# API docs: set DEBUG=true in .env → http://localhost:8000/docs
```

> **Note on the anemia model:** the YOLO detector (`best.pt`) and
> MobileNetV2 (`anemia_mobilenetv2.h5`) need `torch`/`ultralytics` and
> `tensorflow`, which are only installed in the **Docker image** (they are
> multi-GB). Locally, diabetes + hypertension run fully; anemia returns a
> clean `503 model_unavailable` envelope until run in Docker.

### Environment (backend/.env)

| Variable                        | Default                          |
|---------------------------------|----------------------------------|
| `MONGO_URI`                     | `mongodb://localhost:27017`      |
| `MONGO_DB`                      | `aarogya_netra`                  |
| `JWT_SECRET_KEY`                | *(must change in production)*    |
| `ACCESS_TOKEN_EXPIRE_MINUTES`   | `30`                             |
| `REFRESH_TOKEN_EXPIRE_DAYS`     | `7`                              |
| `CORS_ORIGINS`                  | `["*"]`                          |
| `PREDICTIONS_RATE_LIMIT_PER_MINUTE` | `100`                      |
| `MODEL_DIR`                     | `ml_models`                      |
| `MAX_UPLOAD_MB`                 | `10`                             |

---

## 5. Docker quickstart

```bash
docker compose up -d --build          # mongo + backend
docker compose up -d --profile tools  # + Mongo Express on :8081 (admin/admin)

curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/models
```

The backend retries the MongoDB connection 3× on startup (with a
healthcheck gate in compose), creates indexes, and loads all models before
serving.

---

## 6. Mobile setup

```bash
cd mobile
npm install

# 1. Start the backend (Docker or uvicorn on :8000)
# 2. iOS
npx pod-install && npx react-native run-ios
# 2. Android (emulator)
npx react-native run-android
```

The app reads `API_BASE_URL` from `mobile/.env.development`
(default `http://10.0.2.2:8000/api/v1` — the Android-emulator alias for the
host machine) or `mobile/.env.production` for release builds. The values are
inlined at bundle time by the `env-inline` babel plugin (see
`mobile/babel.config.js`).

**First launch:** register → the app stores a JWT pair, auto-logs-in via
`GET /auth/me` on every startup, and persists tokens in AsyncStorage.
Scans upload to the backend and return the **real model output** plus
rule-based recommendations and the mandatory medical disclaimer.

---

## 7. Running the tests

```bash
# Backend — 52 tests (mongomock-motor; real models loaded when available)
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Mobile — 51 tests (Jest + React Native Testing Library)
cd mobile
npx jest --coverage
```

`scripts/validate_models.py` prints one ✅ line per model and ends with
`All models validated successfully!`.

---

## 8. API overview (`/api/v1`)

| Method & path                    | Auth | Description                                    |
|----------------------------------|------|------------------------------------------------|
| `POST /auth/register`            | –    | Create account → user + token pair             |
| `POST /auth/login`               | –    | Login → user + token pair                      |
| `POST /auth/refresh`             | –    | Rotate tokens with a refresh token             |
| `GET/PUT /auth/me`               | JWT  | Read / update profile                          |
| `POST /scans/diabetes`           | JWT  | Snake_case form → real GBC model               |
| `POST /scans/hypertension`       | JWT  | Snake_case form → real XGBoost model           |
| `POST /scans/anemia`             | JWT  | Multipart eye photo + form → YOLO+MobileNetV2  |
| `GET /scans` · `GET /scans/{id}` | JWT  | Paginated history / detail (embedded prediction) |
| `GET /predictions` · `/{id}`     | JWT  | Prediction list / detail                       |
| `GET /predictions/summary`       | JWT  | Latest per-condition risk summary              |
| `GET /health` · `/health/models` | –    | Liveness / model registry metadata             |
| `GET/POST/PUT/DELETE /health/records[/{id}]` | JWT | Manual vitals entries               |

**Envelope (every response):**

```jsonc
// success
{ "success": true,  "data": { ... }, "timestamp": "2026-10-11T12:00:00Z" }
// error
{ "success": false, "error": { "code": "…", "message": "…", "details": { ... } },
  "timestamp": "2026-10-11T12:00:00Z" }
```

---

## 9. Security checklist

- ✅ bcrypt password hashing (cost 12)
- ✅ JWT access (30 min) + refresh (7 d) with **type separation** — a refresh
  token can never be used as an access token and vice versa
- ✅ Every protected route validated; token type enforced server-side
- ✅ CORS restricted via `CORS_ORIGINS`
- ✅ Per-user rate limit on predictions (100/min)
- ✅ Upload validation (type + size cap, 5 MB mobile / 10 MB server)
- ✅ Unified error envelope — no stack traces leak to clients
- ✅ JSON structured logs with per-request `X-Request-ID` + timing
- ✅ Non-root container user; healthchecks; secrets via env
- ✅ Pydantic v2 strict field ranges on every input (clinical bounds)
- ⚠️ **Before production:** set a strong `JWT_SECRET_KEY`, tighten
  `CORS_ORIGINS`, put the API behind TLS (reverse proxy), and add an
  external refresh-token revocation store if token rotation matters.

---

## 10. Contributing

1. Fork & branch: `git checkout -b feat/…` (or `fix/…`).
2. Keep the envelope shape, the camelCase API contract and the feature-based
   mobile structure (`features/<name>/{screens,components,services,hooks}`)
   intact.
3. Add/adjust tests — backend changes need pytest coverage; mobile changes
   need tsc clean (`npx tsc --noEmit`) and jest.
4. No fake/simulated data anywhere except the labeled What-If and
   Risk-Evolution simulations.
5. Open a PR with a short description of the change and the verification you
   ran.

---

## 11. License

MIT — see [LICENSE](LICENSE) *(add your chosen license file; this project is
intended for education, not commercial medical use)*.

---

## 12. Verification status (2026-10-11)

| Check                                        | Status |
|----------------------------------------------|--------|
| `cd mobile && npx tsc --noEmit`              | ✅ 0 errors |
| `cd mobile && npx jest --coverage`           | ✅ 51/51 |
| `cd backend && pytest tests/ -v --cov=app`   | ✅ 52/52, 83% coverage |
| `cd backend && python scripts/validate_models.py` | ✅ (anemia ⚠️ outside Docker) |
| `uvicorn app.main:app` boot + `/api/v1/health` | ✅ |
| `docker compose` file (syntax)               | ✅ validated |
| Medical disclaimer on every result surface   | ✅ banner on hub, all 3 condition screens, scan detail |
