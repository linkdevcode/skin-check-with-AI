# SkinCheck AI

Web app mobile-first (Micro-SaaS) giúp người dùng dán routine skincare (sáng/tối), AI phân tích và trả về điểm số, xung đột hoạt chất, cảnh báo và gợi ý thứ tự bôi thoa.

## Công nghệ

| Lớp | Công cụ |
|-----|---------|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| Ngôn ngữ | TypeScript |
| Giao diện | Tailwind CSS 4, [Lucide React](https://lucide.dev/) |
| Database | [Vercel Postgres](https://vercel.com/storage/postgres) + [Prisma](https://www.prisma.io/) |
| AI (dự kiến) | Google Gemini 2.5 Flash |

## Yêu cầu môi trường

- Node.js 20+ (khuyến nghị LTS)
- npm
- Tài khoản Vercel + Postgres (hoặc PostgreSQL tương thích để phát triển)

## Cài đặt local

```bash
git clone <repository-url>
cd skin-check-with-AI
npm install
```

Tạo file `.env.local` từ mẫu:

```bash
cp .env.example .env.local
```

Điền `DATABASE_URL` trỏ tới Postgres (Vercel Postgres hoặc instance local). Chuỗi kết nối thường cần `sslmode=require` khi dùng Vercel.

Đồng bộ schema (phát triển nhanh, không tạo migration file):

```bash
npm run db:push
```

Chạy dev server:

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Next.js dev (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Sinh Prisma Client |
| `npm run db:push` | Đẩy schema lên DB (dev / prototype) |
| `npm run db:migrate` | Tạo migration (`prisma migrate dev`) |
| `npm run db:studio` | Mở Prisma Studio |

Sau `npm install`, `postinstall` tự chạy `prisma generate`.

## Cấu trúc thư mục (tóm tắt)

```
├── prisma/
│   └── schema.prisma      # Users, Products, Skincare routines, Analysis history
├── src/app/
│   ├── api/               # Route Handlers (API)
│   ├── components/        # UI components
│   ├── services/         # Logic / gọi AI / DB helpers
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── .cursorrules           # Quy ước dự án cho AI / team
└── .env.example           # Mẫu biến môi trường
```

## Triển khai (Vercel + Postgres)

1. Tạo database **Vercel Postgres** trong dashboard, lấy connection string (Prisma).
2. Thêm biến `DATABASE_URL` trong **Settings → Environment Variables** của project Vercel (Production / Preview tùy nhu cầu).
3. Kết nối repo GitHub/GitLab và deploy; build mặc định chạy `npm run build`.
4. Đồng bộ database lần đầu: từ máy local có `DATABASE_URL` đúng, chạy `npm run db:push` hoặc dùng migration (`prisma migrate deploy` trong pipeline khi bạn đã có thư mục `prisma/migrations`).

Không commit file `.env` hoặc `.env.local` (đã liệt kê trong `.gitignore`).

## Giấy phép

Private / theo quyết định của chủ repository.
