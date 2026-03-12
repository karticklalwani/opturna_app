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
| POST | /api/upload | Upload file |

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

## Database Models

Users, Sessions, Accounts, Verification, Posts, Comments, Reactions, Follows, SavedPosts, Collections, Goals, Sprints, SprintMembers, CheckIns, Chats, ChatMembers, Messages, Courses, Lessons, Enrollments, UploadedFiles, Events, EventRsvps, Circles, CircleMembers, Notifications, Reports
