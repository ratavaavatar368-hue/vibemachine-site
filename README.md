# ⚡ Vibe Machine — landing

Студия короткого вертикального видео. От 50 до 1 000 роликов в месяц.
Трафик и контент в одном решении. Над продакшеном думаем мы.

**TikTok · Instagram Reels · YouTube Shorts · ВК Видео**

---

## 🛠 Stack

- **Astro 6** — static-first site generation
- **Tailwind CSS v4** — utility styling via `@theme` tokens
- **React 19** — для islands (3D-tilt, magnetic buttons, WebGL, count-up)
- **Framer Motion / motion** — spring animations
- **@react-three/fiber** — WebGL shader hero background
- **Lenis** — smooth scroll
- **TypeScript** — strict

## 🧞 Commands

```sh
npm install          # установить зависимости
npm run dev          # dev-сервер на localhost:4321
npm run build        # production build → ./dist/
npm run preview      # локальный preview prod-бандла
```

## 📁 Структура

```
src/
├── layouts/
│   └── BaseLayout.astro        # SEO, fonts, grain, scroll progress
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── KineticText.astro       # CSS-only kinetic typography
│   ├── TelegramIcon.astro
│   ├── blocks/                 # 6 блоков лендинга
│   │   ├── Hero.astro
│   │   ├── Diagnosis.astro
│   │   ├── Studio.astro
│   │   ├── Pricing.astro
│   │   ├── FAQ.astro
│   │   └── CTA.astro
│   └── islands/                # React islands (client:* hydration)
│       ├── SmoothScroll.tsx    # Lenis wrapper
│       ├── CustomCursor.tsx
│       ├── MagneticButton.tsx
│       ├── TiltCard.tsx
│       ├── CountUp.tsx
│       └── HeroLightning.tsx   # R3F shader background
├── pages/
│   └── index.astro
└── styles/
    └── global.css              # Tailwind 4 + @theme tokens
```

## 🚀 Deploy

Проект заточен под **Vercel**. Из коробки — zero-config:

1. Импорт этого репозитория в Vercel
2. Framework preset: **Astro** (auto-detect)
3. Deploy → готово

Отдельный Vercel-проект — живёт независимо от основного приложения.

## 🎯 Контакт

Все CTA ведут в **@vibemachine_bot** (Telegram).

