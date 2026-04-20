# ElementPay UI Design Guidelines

This document defines the visual design system for the ElementPay Business Dashboard. All agents and contributors should follow these guidelines to maintain consistency.

---

## Typography

**Primary Font:** Creato Display

- Source: Local OTF files in `/fonts/`
- CSS Variable: `--font-creato-display`
- Tailwind: `font-sans` (mapped to Creato Display)
- Weights available: Thin (100), Light (300), Regular (400), Medium (500), Bold (700), ExtraBold (800), Black (900) — each with italic variants
- Usage: All UI text — headings, body, labels, buttons

---

## Color Palette

### Primary — `#413ACB`

The main brand color used for primary actions, active states, and key UI elements.

| Token              | Hex       | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `primary-100`      | `#D8D7F4` | Light backgrounds, hover tints     |
| `primary-200`      | `#B1AEEA` | Borders, dividers                  |
| `primary-300`      | `#8A86DF` | Disabled states, subtle highlights |
| `primary-400`      | `#645ED4` | Hover states                       |
| **`primary-500`**  | `#413ACB` | **Default / Primary action**       |
| `primary-600`      | `#312BA1` | Pressed states                     |
| `primary-700`      | `#242079` | Dark accents                       |
| `primary-800`      | `#181551` | Dark backgrounds                   |
| `primary-900`      | `#0C0B28` | Deepest contrast                   |

### Secondary — `#FF90A8`

Used for accents, alerts, and secondary call-to-action elements.

| Token               | Hex       | Usage                        |
| -------------------- | --------- | ---------------------------- |
| `secondary-100`      | `#FFCCD7` | Light backgrounds, badges    |
| `secondary-200`      | `#FF99AF` | Borders, soft accents        |
| `secondary-300`      | `#FF6687` | Highlights                   |
| `secondary-400`      | `#FF335F` | Hover states                 |
| **`secondary-500`**  | `#FF90A8` | **Default / Secondary**      |
| `secondary-600`      | `#CC002C` | Pressed / error states       |
| `secondary-700`      | `#990021` | Dark accents                 |
| `secondary-800`      | `#660016` | Dark backgrounds             |
| `secondary-900`      | `#33000B` | Deepest contrast             |

### Tertiary — `#368F8A`

Used for success states, supporting information, and data visualization accents.

| Token              | Hex       | Usage                        |
| ------------------- | --------- | ---------------------------- |
| `tertiary-100`      | `#D8F0EF` | Light backgrounds, tags      |
| `tertiary-200`      | `#B5E3E1` | Borders, soft accents        |
| `tertiary-300`      | `#90D5D2` | Highlights                   |
| `tertiary-400`      | `#6BC7C2` | Hover states                 |
| **`tertiary-500`**  | `#368F8A` | **Default / Tertiary**       |
| `tertiary-600`      | `#38948F` | Pressed states               |
| `tertiary-700`      | `#2A6F6C` | Dark accents                 |
| `tertiary-800`      | `#1C4A48` | Dark backgrounds             |
| `tertiary-900`      | `#0E2524` | Deepest contrast             |

---

## Tailwind Usage

All palette colors are available as Tailwind utilities:

```html
<!-- Backgrounds -->
<div class="bg-primary-500">...</div>
<div class="bg-secondary-100">...</div>
<div class="bg-tertiary-700">...</div>

<!-- Text -->
<p class="text-primary-400">...</p>

<!-- Borders -->
<div class="border border-tertiary-300">...</div>
```

---

## General Principles

- Use **primary** for core interactive elements (buttons, links, active nav items)
- Use **secondary** sparingly for attention-drawing elements (CTAs, alerts, badges)
- Use **tertiary** for success/positive states, secondary data, and supporting visuals
- Dark mode defaults: `background: #0a0a0a`, `foreground: #ededed`
- Light mode defaults: `background: #ffffff`, `foreground: #171717`

---

*This file will be expanded with spacing, component patterns, iconography, and motion guidelines as the design system evolves.*
