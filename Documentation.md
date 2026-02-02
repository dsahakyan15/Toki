# 🎵 Toki - MVP Specification

## 1. Project Overview
**Concept:** A music-centric social network focused on synchronized listening experiences and a minimalist pastel aesthetic.
**Platform:** Web Application (PWA - Mobile First Design).
**Core Mechanic:** **Listen Together** (Shared Listening / Совместное прослушивание) - основная функция приложения. Users navigate between sections using a bottom navigation bar or fluid swipe gestures.

---

## 2. Technical Architecture

* **Frontend:** React.js (Next.js) + Tailwind CSS + **Zustand** (State Management) + Framer Motion.
* **Backend:** Node.js (Express).
* **Database:** PostgreSQL (Relational data) + Redis (Real-time room states).
* **Real-time Engine:** Socket.io (Essential for "Listen Together" synchronization).
* **File Storage:** AWS S3 or MinIO.
* **Authentication:** Email & Password via JWT.

---

## 3. Design System & UI

### Color Palette
* **Theme:** Soft Pastel Colors (пастельные цвета).
* **Background:** Neutral Cream or Off-white.

### UI Patterns & Navigation
* **Navigation Bar (Bottom):**
    1.  **Главная страница** (Icon: Musical Note 🎵): Main feed and discovery.
    2.  **Слушать вместе** (Icon: Infinity ∞): Core shared listening rooms.
    3.  **Мой Аккаунт** (Icon: User 👤): User profile and personal library.
* **Gestures:** Navigation between these views can also be performed via **horizontal swipes** (горизонтальные свайпы).
* **Mini-Player:** During active playback, a **half-vinyl record** (horizontally cut / разрезан по горизонтали пополам) appears at the bottom navigation layer, spinning while music is playing.

### Search Behavior
* **Mobile/Tablet:** Revealed via a **pull-down gesture** at the top of the feed (пользователь тянет вниз - сверху ленты появляется поиск).
* **Desktop:** Fixed at the **top** of the interface for immediate access.

---

## 4. Feature Specifications

### 4.1 Authentication
* **Method:** Email + Password (через почту и пароль).
* **Flow:** Input Email -&gt; Set Password -&gt; Profile Setup -&gt; Receive JWT.

### 4.2 Listen Together / "Infinity Room" (Core Screen)
* **Access:** Middle button on Nav Bar (Слушать вместе) or Swipe.
* **UI:** Focus on the active track and room participants.
* **Queue System:** 
    * Limit: Max 20 tracks.
    * Logic: FIFO (First-In-First-Out).
* **Chat:** Real-time text overlay for interacting with other listeners.

### 4.3 User Profile
* **Avatar:** User photo or auto-generated Pastel Vinyl.
* **Privacy:** Locked profile option for non-friends.

---

## 5. Database Schema (PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50),
    avatar_url TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Friendships
CREATE TABLE friendships (
    user_id_1 INT REFERENCES users(id),
    user_id_2 INT REFERENCES users(id),
    status VARCHAR(20) -- 'pending', 'accepted', 'blocked'
);

-- Tracks
CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    artist VARCHAR(100),
    file_url TEXT NOT NULL,
    cover_url TEXT,
    duration INT
);

-- Stories
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    track_id INT REFERENCES tracks(id),
    created_at TIMESTAMP DEFAULT NOW()
);