# 🏨 Hotel Booking System

Production-grade hotel room booking platform — concurrent-safe, async-notified, cached, dockerised, CI/CD ready.

Stack: **Spring Boot 3 (Java 21) · React 18 + Vite · PostgreSQL 16 · Redis 7 · RabbitMQ 3 · Docker · GitHub Actions · Azure VM**

---

## ✨ Highlights

- **3-layer concurrent booking protection** — Redis distributed lock + DB pessimistic lock + Postgres `EXCLUDE` constraint. Verified with 20-thread stress test.
- **Transactional outbox lite** — `@TransactionalEventListener(AFTER_COMMIT)` đảm bảo không bao giờ gửi "ghost event" sang RabbitMQ.
- **Redis cache invalidation** event-driven, không dựa hoàn toàn vào TTL.
- **JWT stateless auth** với custom `AuthenticationEntryPoint` → frontend nhận JSON chuẩn cho mọi auth failure.
- **Production-grade frontend**: dark mode (anti-FOUC), confetti on success, top loading bar, skeleton, social proof badge, offline detection, ErrorBoundary, `prefers-reduced-motion` support, lazy image với blur placeholder, persisted search.
- **CI/CD**: GitHub Actions test + build + push GHCR; manual CD deploy lên Azure VM qua SSH.

---

## 🏗️ Architecture

```
                     ┌──────────────────────────────┐
                     │   Browser  (React SPA)       │
                     └──────────────┬───────────────┘
                                    │  HTTPS
                     ┌──────────────▼───────────────┐
                     │ nginx (Frontend container)   │
                     │  · Static SPA assets         │
                     │  · /api/* → backend           │
                     │  · gzip + security headers   │
                     └──────────────┬───────────────┘
                                    │  HTTP /api/*
                     ┌──────────────▼───────────────┐
                     │  Spring Boot Backend         │
                     │  · JWT filter (stateless)    │
                     │  · Booking, Room, Auth APIs  │
                     └─┬──────────────┬─────────────┘
                       │              │
              ┌────────▼─┐    ┌──────▼──────┐    ┌─────────────┐
              │ Postgres │    │   Redis     │    │  RabbitMQ   │
              │ · ACID   │    │  · Lock     │    │  · Events   │
              │ · gist   │    │  · Cache    │    │  · Notify   │
              │   EXCL   │    └─────────────┘    └──────┬──────┘
              └──────────┘                              │
                                                  ┌────▼─────────┐
                                                  │ Notification │
                                                  │ Consumer     │
                                                  │ (log → email)│
                                                  └──────────────┘

   Tất cả container chạy trong docker-compose / cùng app-network bridge.
```

---

## 🚀 Quick start

### Prerequisites

- Docker Desktop
- Java 21 + Maven (chỉ khi chạy backend ngoài container)
- Node 20+ (chỉ khi chạy frontend ngoài container)

### One-liner

```bash
cp .env.example .env
docker compose up --build -d
```

Sau khi mọi service healthy (mất ~1 phút lần đầu vì build):

| Service        | URL                              | Note                          |
|----------------|----------------------------------|-------------------------------|
| Frontend       | http://localhost                  | SPA chính                     |
| Backend API    | http://localhost:8080/api/v1     | RESTful JSON                  |
| Health         | http://localhost:8080/actuator/health |                        |
| RabbitMQ UI    | http://localhost:15672 (guest/guest) |                          |
| Postgres       | localhost:5432 (user/pass trong `.env`) |                       |

Demo admin account: **`admin@example.com / admin123`** (tạo bởi `DataInitializer` lúc startup).

---

## 📋 API quick reference

```
POST   /api/v1/auth/register          { email, password, fullName }
POST   /api/v1/auth/login             { email, password }
POST   /api/v1/auth/logout

GET    /api/v1/rooms                  (public)
GET    /api/v1/rooms/{id}             (public)
GET    /api/v1/rooms/available?checkIn&checkOut   (public, cached 60s)
POST   /api/v1/rooms                  (ADMIN)
PUT    /api/v1/rooms/{id}             (ADMIN)

POST   /api/v1/bookings               (auth)    ← 3-layer concurrent-safe
GET    /api/v1/bookings/my            (auth)
GET    /api/v1/bookings/{id}          (auth)
DELETE /api/v1/bookings/{id}          (auth)    soft cancel

GET    /actuator/health               (public)
```

Mọi response wrap trong `ApiResponse<T>`:
```json
{ "success": true,  "data": { ... }, "timestamp": "..." }
{ "success": false, "error": { "code": "ROOM_ALREADY_BOOKED", "message": "..." }, "timestamp": "..." }
```

---

## 🧪 Verify concurrent-safety (the core demo)

```powershell
# Login để lấy token
$body = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/v1/auth/login" `
    -ContentType "application/json" -Body $body).data.accessToken

# 20 request đặt cùng phòng + cùng ngày, song song
# (Bản đầy đủ trong /docs hoặc xem session implement chi tiết)
```

**Kết quả mong đợi:** Đúng **1 SUCCESS**, **19 REJECT** (mix giữa `BOOKING_IN_PROGRESS` từ Redis lock và `ROOM_ALREADY_BOOKED` từ DB). DB chỉ có **1 booking** với status CONFIRMED.

---

## 🎯 System Design talking points (interview cheatsheet)

| Câu hỏi | Câu trả lời ngắn |
|---|---|
| *"Làm sao chống double-booking?"* | 3 layer: Redis SETNX → DB SELECT FOR UPDATE → Postgres `EXCLUDE USING gist`. Mỗi layer bù khuyết điểm layer khác. |
| *"Tại sao cần Redis lock khi đã có DB lock?"* | Reject sớm ở edge, giảm DB connection pressure. DB lock đắt hơn ~10x. |
| *"Release Redis lock trước hay sau commit?"* | Sau commit. Trước commit → request thứ 2 vào, lãng phí DB lock chờ; nếu rollback → 2 luồng cùng cố booking → cuối cùng EXCLUDE constraint cứu. |
| *"Self-invocation `@Transactional`?"* | Spring AOP proxy không intercept self-call → `@Transactional` không kích hoạt. Tách logic transactional sang bean khác (xem `BookingTransactionalOps`). |
| *"Đảm bảo event và DB write atomic?"* | `@TransactionalEventListener(AFTER_COMMIT)` — Spring chỉ fire listener sau commit. Production refactor sang transactional outbox đầy đủ. |
| *"Cache invalidation strategy?"* | TTL 60s + event-driven evict khi `BookingCreatedEvent`. Eventual consistency acceptable cho UC này. |
| *"Tại sao JWT, không phải session?"* | Stateless → scale horizontal dễ. Trade-off: khó revoke → cần Redis blacklist. |
| *"Frontend SPA bị 401 thì sao?"* | Axios response interceptor catch, logout, redirect `/login?from=<here>` để giữ context cho user. |

---

## 🛠️ Project structure

```
.
├── booking-backend/         # Spring Boot 3 · Java 21
│   ├── src/main/java/com/booking/
│   │   ├── config/          # Security, Redis, RabbitMQ, Cache, DataInitializer
│   │   ├── domain/          # user · room · booking (entity + repo + service + controller + DTOs + events)
│   │   ├── infrastructure/  # security/JwtService · redis/RedisLockService · messaging/Publisher+Consumer
│   │   └── shared/          # ApiResponse · exception hierarchy · GlobalExceptionHandler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/    # Flyway V1..V6
│   ├── src/test/            # Unit tests
│   ├── pom.xml
│   └── Dockerfile           # Multi-stage maven build → JRE alpine runtime
│
├── booking-frontend/        # React 18 + Vite
│   ├── src/
│   │   ├── api/             # axios client với JWT interceptor
│   │   ├── features/        # auth · rooms · bookings (page + hook + components)
│   │   ├── shared/          # components · hooks · lib (format, recentlyViewed) · theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf           # SPA fallback + /api proxy + security headers + gzip
│   └── Dockerfile           # Multi-stage node build → nginx alpine
│
├── docker-compose.yml       # 5 services (postgres, redis, rabbitmq, backend, frontend)
├── .env.example
└── .github/workflows/
    ├── ci.yml               # Build + test + push images to ghcr.io
    └── deploy.yml           # Manual deploy to Azure VM
```

---

## 🚢 CI/CD pipeline

### CI (`ci.yml`) — push hoặc PR vào main

1. `backend-test` — `mvn test` + build JAR (Java 21, Maven cache)
2. `frontend-build` — `npm ci && npm run build` (Node 20, npm cache)
3. `docker-images` (chỉ trên push main) — build + push 2 images lên `ghcr.io/<owner>/booking-{backend,frontend}` với tag `latest` + `sha-<commit>`. Buildx cache layers giữa các run.

### CD (`deploy.yml`) — manual trigger với image tag chỉ định

1. Tạo bundle `docker-compose.yml + .env` (từ GitHub secrets)
2. SCP bundle lên Azure VM
3. SSH chạy `docker compose pull && docker compose up -d`
4. Loop curl `/actuator/health` đến khi backend healthy hoặc timeout 5 phút

### Required GitHub secrets

| Secret | Mô tả |
|---|---|
| `AZURE_VM_HOST`, `AZURE_VM_USER`, `AZURE_VM_SSH_KEY` | SSH credentials |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Postgres |
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | RabbitMQ |
| `JWT_SECRET` | ≥ 32 chars, random |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin bootstrap |

`GITHUB_TOKEN` được Actions tự cấp, dùng để pull image từ GHCR trên VM.

---

## 🔧 Development workflows

### Backend dev (without docker)
```bash
cd booking-backend
mvn spring-boot:run
# Cần Postgres + Redis + RabbitMQ chạy local hoặc qua: docker compose up -d postgres redis rabbitmq
```

### Frontend dev (with hot reload)
```bash
cd booking-frontend
npm install
npm run dev      # http://localhost:5173, proxy /api → :8080
```

### Reset DB (xoá toàn bộ data)
```bash
docker compose down -v && docker compose up -d
```

---

## 📚 Learning trace

Đây là demo cho System Design interview ở mức intern/junior. Nếu bạn muốn đọc tuần tự quá trình build:

1. **Phase 1 — Foundation**: Spring Boot init, Flyway, User + JWT auth, Docker Compose
2. **Phase 2 — Core domain**: Room + Booking với 3-layer lock (Redis + Pessimistic + EXCLUDE)
3. **Phase 3a — Async & Caching**: RabbitMQ outbox-lite, NotificationConsumer, Redis cache + event-driven evict
4. **Phase 3b — Frontend**: React + Vite, Zustand auth, axios interceptor, custom hooks
5. **Phase 4 — DevOps**: Dockerfile, multi-service compose, GitHub Actions CI/CD

Mỗi phase có "📚 Học được gì?" block giải thích *why*, không chỉ *what*.

---

## 📝 License

MIT — dùng tự do cho học tập / portfolio / phỏng vấn.
