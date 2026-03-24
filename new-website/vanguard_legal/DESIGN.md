# Design System Specification: Editorial Tech-Legal

## 1. Overview & Creative North Star
**Creative North Star: "The Neon Magistrate"**
This design system rejects the stuffy, wood-paneled clichés of traditional law firms in favor of a high-velocity, tech-first aesthetic. We are building a "Digital Sanctuary" for workers—an environment that feels as elite as a Supreme Court chamber but as agile as a Silicon Valley unicorn. 

To achieve this, we move away from standard grid-bound templates. The layout should feel like a premium editorial magazine: intentional asymmetry, dramatic scale shifts in typography, and "breathing" compositions. We don't just present information; we curate authority through dark-mode depth and vibrant, kinetic accents.

## 2. Colors
Our palette is rooted in absolute darkness to provide a canvas for high-contrast clarity and "electric" purple highlights.

*   **The "No-Line" Rule:** Standard 1px solid borders are strictly prohibited for defining sections. Structural separation must be achieved exclusively through background shifts (e.g., a `surface-container-low` section transitioning into a `surface` section) or intentional white space from our spacing scale.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. 
    *   **Base:** `surface` (#0e0e0e)
    *   **Raised Content:** `surface-container` (#191919)
    *   **Interactive/Top-Layer:** `surface-container-high` (#1f1f1f)
*   **The "Glass & Gradient" Rule:** Floating elements (modals, navigation bars) should utilize Glassmorphism. Use `surface-variant` at 60% opacity with a `20px` backdrop-blur to allow the background content to "ghost" through.
*   **Signature Textures:** For high-impact areas (Hero CTAs or Section Headers), use a linear gradient: `primary` (#cc97ff) to `primary-dim` (#9c48ea) at a 135-degree angle. This adds a "soul" to the tech aesthetic that flat HEX codes cannot provide.

## 3. Typography
We use a dual-typeface system to balance "Lawyerly Authority" with "Modern Tech Accessibility."

*   **Display & Headlines (Manrope):** These are our "Voice of Authority." Use `display-lg` for hero statements. Don't be afraid of tight letter-spacing (-0.02em) on headlines to create a compact, high-end feel.
*   **Body & Titles (Inter):** The "Workhorse." Inter provides maximum legibility for complex legal text. 
*   **Hierarchy Strategy:** 
    *   Use `headline-lg` for section starts, but pair it immediately with a `label-md` "kicker" in all-caps `primary` color above the headline to anchor the eye.
    *   `body-lg` should be used for lead paragraphs to maintain a premium, easy-to-read editorial feel.

## 4. Elevation & Depth
In this system, depth is a matter of light and tone, not physical shadows.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-highest` card on a `surface-container-low` background. The subtle shift from `#262626` to `#131313` creates a sophisticated "lift" without visual clutter.
*   **Ambient Shadows:** If an element must float (e.g., a dropdown), use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. Never use harsh, dark-grey shadows; let the black background absorb the light naturally.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use a "Ghost Border." Apply `outline-variant` (#484848) at **20% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_tint` (#cc97ff) at 5% opacity as an overlay on glass containers to give them a subtle purple "energy" glow.

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `on_primary_fixed` (#000000) text. Use `radius-md` (0.375rem). The hover state should transition to `primary_container`.
*   **Secondary:** Ghost style. `Ghost Border` (outline-variant at 20%) with `on_surface` text. 
*   **Tertiary:** Text-only with a `primary` color underline that expands on hover.

### Chips (Badges)
*   Used for legal categories (e.g., "Class Action," "Labor Law"). 
*   **Style:** `surface-container-highest` background with `primary` text. Use `radius-full`. No borders.

### Lists & Cards
*   **The Divider Ban:** Strictly forbid 1px horizontal dividers. Use `spacing-6` (2rem) to separate list items, or use alternating `surface-container-low` and `surface-dim` backgrounds for striped lists.
*   **Cards:** Use `surface-container` with `radius-xl` (0.75rem). Ensure internal padding is at least `spacing-5` (1.7rem) to maintain the "Editorial" feel.

### Input Fields
*   **Default:** `surface-container-high` background, `radius-sm`. 
*   **Focus State:** A 1px "Ghost Border" using `primary` at 50% opacity and a subtle `primary` outer glow (4px blur).
*   **Error:** Use `error_dim` (#d73357) for text and a `surface-container-high` background.

### Tech-Startup Specialized Components
*   **The "Trust Ticker":** A horizontal auto-scrolling row of logos (clients/partners) using `on_surface_variant` at 40% opacity to look integrated into the background.
*   **Floating Navigation:** A glassmorphic bar using `surface-container` at 70% opacity, fixed to the top with a `1.5rem` margin from the screen edges (not full width).

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Align a headline to the left and the body text to a 60% offset column to the right.
*   **Do** use `primary` (#cc97ff) sparingly. It should be a "surgical strike" of color, not a wash.
*   **Do** lean into `spacing-16` and `spacing-20` for section margins. Space is luxury.

### Don't
*   **Don't** use pure white (#ffffff) for large blocks of body text. Use `on_surface_variant` (#ababab) to reduce eye strain on the black background.
*   **Don't** use sharp corners. Use `radius-md` as your baseline to keep the "accessible" feel.
*   **Don't** use standard "Lawyer" iconography (scales, gavels). Use abstract geometric shapes or high-end tech-style line icons.