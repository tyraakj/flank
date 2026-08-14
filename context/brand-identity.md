# Brand Identity

This document defines the core visual language, color palette, and brand accents for the Flank platform.

## Core Theme

Flank operates on a strict **Dark Default** theme. The application surface area consists of near-black backgrounds, muted dark surfaces, and subtle, low-opacity borders to create a dense, technical workspace optimized for data reading.

## The Gradient Accents

To contrast the dense, dark technical UI, Flank uses vibrant, high-energy gradient accents for landing pages, hero moments, and premium feature showcases. These gradients convey speed, intelligence, and modern AI capabilities.

### 1. Speed & Discovery (Pink/Red)
Used to highlight automated discovery, speed, and market coverage.
- **Start:** Pink-500 / Pink-600
- **End:** Red-500
- **Tailwind class:** `from-pink-500 to-red-500`

### 2. Deep Extraction (Purple/Fuchsia)
Used to highlight complex data processing, matrix extraction, and AI reasoning capabilities.
- **Start:** Purple-500 / Purple-600
- **End:** Fuchsia-500
- **Tailwind class:** `from-purple-500 to-fuchsia-500`

### 3. Actionable Strategy (Orange/Red)
Used to highlight edge opportunities, strategic recommendations, and high-impact actions.
- **Start:** Orange-400 / Orange-500
- **End:** Red-500
- **Tailwind class:** `from-orange-500 to-red-500`

### 4. The Master Gradient
When a unified brand glow or text gradient is needed (e.g., highlighting key words in a headline), combine the three primary colors:
- **Sequence:** Pink → Purple → Orange
- **Tailwind class:** `bg-gradient-to-r from-pink-500 via-purple-400 to-orange-400`

## Application of Color

- **Glow Effects:** Use these gradients as large, highly blurred background shapes (e.g., `blur-[150px] opacity-20`) behind hero sections or cards to create an ambient glow.
- **Feature Cards:** Apply these gradients as subtle backgrounds (`opacity-20` to `opacity-50`) inside premium feature cards to differentiate them.
- **Text Accents:** Use as `bg-clip-text text-transparent` to highlight a single key phrase or word in a large headline. Do not use gradient text for body copy or small UI elements.
- **Action Buttons (CTAs):** Primary landing page CTAs should either use a solid white pill design (`bg-white text-black`) or a solid brand color (e.g., `bg-primary`) to stand out against the dark and colorful backgrounds.

## Typography

- **Headlines (Landing Pages):** Large, elegant serif or highly legible sans-serif fonts, using tight tracking and high contrast.
- **UI / App Text:** Inter (or Geist Sans)
- **Data / Mono:** Geist Mono, with tabular numerals for data matrices.
