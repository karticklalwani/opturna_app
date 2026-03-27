# Opturna

A premium social network and intelligence platform for ambitious people focused on business, growth, finance, and global taxation strategy.

## Design System

**Theme**: Ultra-dark premium fintech terminal aesthetic (Robinhood meets Linear)
- **Background**: `#080808` (near-black), surface layers `#0F0F0F`, `#141414`, `#1A1A1A`
- **Text**: `#F5F5F5` primary, `#A3A3A3` secondary, `#737373` muted, `#404040` ghost
- **Accent**: `#4ADE80` green (single bold accent — all CTAs, active states, highlights)
- **Destructive**: `#EF4444` red (errors, delete actions only)
- **Tab bar**: Icon-only with green dot indicator for active tab, no labels
- **Typography**: Bold editorial style — large headings with tight letter-spacing (-1 to -2)

## Stack

- **Mobile**: Expo SDK 53, React Native 0.79, NativeWind (Tailwind), expo-router
- **Backend**: Hono + Bun, Prisma (SQLite), Better Auth
- **Auth**: Email OTP via Better Auth + Vibecode SMTP

## Features

### Authentication
- Email OTP login (no password needed)
- Session-based auth with Better Auth
- Protected routes via Stack.Protected

### Feed (5 categories)
- For You / Progress / Learning / Questions / Inspiration
- Post types: text, image, video, carousel, poll, check-in
- Reactions: Useful, Inspired, Good Progress, Interesting
- Save posts to collections
- Hashtags and categories

### Accountability (Sprints)
- 7, 14, 30-day sprints
- Daily check-ins with streak tracking
- Goal board with OKR-style progress % (0-100)
- Milestone tracking per goal

### Academy
- Course browser with categories
- Free / Followers-only / Pro content tiers
- Lesson tracking

### Discover (Content)
- Curated articles by category (Finanzas, Crecimiento, Tecnologia, Impuestos, etc.)
- Featured, news, and recommended content cards
- In-app article detail view (no external browser needed)
- Search by title, user, hashtags

### Media / Reels / Stories
- TikTok-style vertical video feed with full-screen paging (WebView-based player)
- Stories bar (24h TTL, image/video, Instagram-style gradient ring avatars)
- Media Discover screen: trending carousel, 3-col reels grid, recent list
- Upload screen with expo-image-picker (video & image support, progress bar)
- Real engagement: likes, comments, saves, views — all persisted in SQLite
- Proprietary algorithm: score = views + likes×3 + comments×5 + saves×4 + watchTime×2
- 7 demo posts with real video URLs (Google CDN samples)
- 4 active stories (24h auto-expiry)
- Accessible from Discover tab → Media & Reels banner
- File storage: backend/uploads/ served statically via GET /uploads/*

### Creators / Partners Hub
- Premium discovery section for creators, founders, investors, traders, companies, prop firms, and brands
- Verified profiles with badges (verified, partner official)
- Category filters: business, finance, trading, startups, AI, creator, education, mindset, productivity, investing
- Featured creators carousel + official partners section
- Creator profile pages with tabs: Posts, Videos, Entrevistas, Directos, Proyectos, Colabs
- Social links (web, YouTube, podcast, Instagram, X, LinkedIn, Telegram)
- Embedded interviews and videos
- Upcoming lives / scheduled events
- Collaboration showcase with CTA buttons
- Seed demo data: 5 profiles (Alejandro Martín, Sofía Vega, Carlos Rueda, NexoFin, Apex Prop Trading)
- Accessible from Discover tab → Creators Hub banner

### Research (Stock Market)
- Yahoo Finance stock/market data integration
- Quote engine with price, change %, market cap, P/E ratio
- Fundamental analysis (P/E, P/S, P/B, EV/EBITDA, ROE, debt ratios)
- News feeds per stock
- AI-powered company insights (OpenAI)

### Live (Directos)
- Real-time broadcasts/streaming
- WebSocket infrastructure

### Messages
- 1:1 direct messages
- Group chats
- Real-time polling

### Profile
- Bio, ambition, current focus
- Follower/following counts
- Stats: goals completed, active goals, best streak
- Edit profile modal

## Backend API

Base URL from `EXPO_PUBLIC_BACKEND_URL`

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/creators | List creators (filters: category, type, featured, partner, search) |
| GET | /api/creators/categories | Creator categories list |
| GET | /api/creators/interviews | Featured interviews |
| GET | /api/creators/lives | Upcoming and live sessions |
| GET | /api/creators/:slug | Full creator profile with all content |
| GET | /api/creators/:slug/posts | Creator posts |
| GET | /api/creators/:slug/videos | Creator videos |
| GET | /api/creators/:slug/interviews | Creator interviews |
| POST | /api/creators/seed | Seed demo creator data |
| GET | /api/me | Current user profile |
| PATCH | /api/me | Update profile |
| GET | /api/users/:id | User profile |
| POST | /api/users/:id/follow | Follow/unfollow |
| GET | /api/posts | Feed (optional ?category=) |
| POST | /api/posts | Create post |
| POST | /api/posts/:id/react | React to post |
| GET | /api/posts/:id/comments | Get comments |
| POST | /api/posts/:id/comments | Add comment |
| POST | /api/posts/:id/save | Save/unsave post |
| GET | /api/goals | User goals |
| POST | /api/goals | Create goal |
| PATCH | /api/goals/:id | Update goal |
| GET | /api/sprints | User sprints |
| POST | /api/sprints | Create sprint |
| POST | /api/sprints/:id/checkin | Check in |
| GET | /api/chats | User chats |
| POST | /api/chats | Create chat |
| GET | /api/chats/:id/messages | Get messages |
| POST | /api/chats/:id/messages | Send message |
| GET | /api/courses | Browse courses |
| POST | /api/courses | Create course |
| GET | /api/events | Upcoming events |
| POST | /api/events | Create event |
| POST | /api/events/:id/rsvp | RSVP to event |
| GET | /api/circles | Public circles |
| POST | /api/circles | Create circle |
| GET | /api/notifications | Notifications |
| PATCH | /api/notifications/read-all | Mark all read |
| POST | /api/reports | Report content |
| POST | /api/ai/chat | AI chat (streaming SSE) — OpenAI gpt-4o |
| GET | /api/content | Curated articles by category |
| GET | /api/content/:id | Article detail |
| POST | /api/upload | Upload file |

### Research API
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/research/quote/:symbol | Stock quote (Yahoo Finance) |
| GET | /api/research/search | Symbol search |
| GET | /api/research/fundamentals/:symbol | Company fundamentals |
| GET | /api/research/news | News feed |
| GET | /api/research/history/:symbol | Historical prices |
| POST | /api/research/ai-insights | AI analysis (OpenAI) |

### Anti-Inflation Financial System (Ahorro Tab)
- **Valor Real del Dinero**: Real-time inflation dashboard showing savings purchasing power loss, Spain/Eurozone/World/Food inflation rates, category breakdown, and 10-year historical chart. Data from INE, Eurostat, WorldBank APIs with 1-hour cache.
- **Simulador Anti-Inflacion**: Calculate future value of money, inflation loss, compare savings vs investment, year-by-year SVG projection charts.
- **Comparador de Paises**: 31 countries with inflation rates, region filter, color-coded rates, trend indicators, detail comparison vs Spain.
- **Pignorar**: Pledge/collateral simulator - calculate liquidity, costs, risk assessment. Compare vs selling, traditional loans, inflation impact.
- **Gestor de Patrimonio**: Financial health analyzer (0-100 score), savings rate, debt-to-income ratio, emergency fund coverage, personalized recommendations.
- **IA Liquidez Inteligente**: Specialized AI financial advisor for liquidity, pignorar, inflation strategies. Uses OpenAI when available, rule-based fallback.

### Inflation API
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/inflation/real-time | Real-time inflation data from INE/Eurostat/WorldBank |
| POST | /api/inflation/simulate | Anti-inflation purchasing power simulator |
| POST | /api/inflation/pignorar | Pignorar (pledge) cost and comparison simulator |
| POST | /api/inflation/patrimonio | Financial health analysis and recommendations |
| POST | /api/inflation/ai-advisor | AI financial advisor for liquidity questions |
| GET | /api/inflation/countries | Country inflation list (31 countries by region) |

## AI Assistant

The AI Assistant (`/api/ai/chat`) uses OpenAI gpt-4o with a comprehensive system prompt covering:
- **Global Taxation**: US (IRS, capital gains, pass-through entities), EU (VAT, ATAD, DAC6), UK, LATAM (Mexico ISR/IVA, Brazil IRPJ/CSLL, Argentina), APAC (Singapore, Australia, India GST), Middle East (UAE 9% corporate, Saudi zakat)
- **International Tax**: OECD BEPS, Pillar One/Two (15% global minimum), transfer pricing, CFC rules, tax treaties
- **Business & Finance**: startup strategy, investment, fundraising, financial modeling
- Supports real-time SSE streaming: pass `stream: true` in body, parse `response.output_text.delta` events

## Design System

- Background: `#0A0A0A`
- Accent / CTA: `#F59E0B` (amber/gold)
- Surface: `#141414`, `#1C1C1E`
- Text primary: `#FAFAFA`
- Text secondary: `#71717A`
- Success: `#22C55E`
- Info: `#3B82F6`
- Error: `#EF4444`

### Tasks API
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | Get user tasks (optional ?goalId=) |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Habits API
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/habits | Get user habits (with last 60 check-ins) |
| POST | /api/habits | Create habit |
| PATCH | /api/habits/:id | Update habit |
| DELETE | /api/habits/:id | Delete habit |
| POST | /api/habits/:id/checkin | Toggle today's check-in, auto-recalculates streak |

### Projects API
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | Get user projects |
| POST | /api/projects | Create project |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

## Database Models

Users, Sessions, Accounts, Verification, Posts, Comments, Reactions, Follows, SavedPosts, Collections, Goals, Tasks, Habits, HabitCheckIns, Projects, Sprints, SprintMembers, CheckIns, Chats, ChatMembers, Messages, Courses, Lessons, Enrollments, UploadedFiles, Events, EventRsvps, Circles, CircleMembers, Notifications, Reports
