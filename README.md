# 🌱 Farm Tasks

Farm Tasks is a gamified task management application that transforms your daily to-do lists into a thriving, interactive pixel-art garden. Built with Next.js, Supabase, and Phaser 3, it allows you to plant seeds by creating goals, grow them by completing tasks, and watch your garden flourish alongside other players in real-time!

## ✨ Features

- **Gamified Productivity**: Create goals and break them down into actionable sub-tasks.
- **Interactive 2D Garden**: A fully playable, isometric-style pixel art garden powered by **Phaser 3**.
- **Dynamic Growth**: Your plants evolve from seeds to sprouts, saplings, and finally mature trees as you complete your real-life tasks.
- **Custom Pixel Art**: Mature trees dynamically load beautifully designed 100x100 pixel art sprites.
- **Real-time Multiplayer**: See other farmers walking around their gardens live using Supabase Realtime presence.
- **Robust Authentication**: Secure user login and registration powered by Supabase Auth.
- **Modern UI**: Sleek, pixel-themed UI built with React and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React, Tailwind CSS
- **Game Engine**: [Phaser 3](https://phaser.io/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Realtime**: Supabase Realtime (Presence & Broadcasts)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com/) account and project

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd farm_tasks
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Inside `.env.local`, you will need:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 4. Setup the Database

This project uses Supabase migrations. You can push the database schema to your Supabase project using the Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

*Note: The migrations include all the necessary tables (`goals`, `tasks`, etc.), Row Level Security (RLS) policies, and the `complete_task` RPC used for securely calculating plant growth.*

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can register a new account and start planting immediately!

## 🌳 Managing Tree Sprites

When a plant reaches 100% completion (Mature state), it is randomly assigned a tree sprite from the `public/tree sprites/` directory.

To add new tree varieties:
1. Simply drop your 100x100 pixel art `.png` files into `public/tree sprites/`.
2. The game will automatically detect the new files and start awarding them for newly completed goals!

## 📜 License

This project is open-source and available under the MIT License.
