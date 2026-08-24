---
name: StandardsIQ
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#303539'
  on-tertiary: '#ffffff'
  tertiary-container: '#474c4f'
  on-tertiary-container: '#b8bcc0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
  max-width: 1440px
---

## Brand & Style
The design system is anchored in **Professional Minimalism**, prioritizing clarity, density, and institutional trust. It is designed for government officials and procurement officers who require a high-performance environment for complex data management. 

The visual language draws from modern engineering-led products, utilizing a high-density layout, meticulous alignment, and a restrained color palette to convey stability and auditability. The aesthetic avoids all decorative trends (no blurs, no gradients) in favor of a "document-first" approach where the interface recedes to let the data lead.

**Key Principles:**
- **Institutional Trust:** High legibility and clear hierarchy to facilitate decision-making.
- **Operational Speed:** Compact layouts that minimize scrolling and keep relevant tools within reach.
- **Precision:** Mathematical spacing and thin, consistent borders that reflect the accuracy of BIS compliance.

## Colors
The palette is intentionally limited to emphasize professional utility and structural clarity.

- **Primary (#1E40AF):** A deep, restrained navy used exclusively for primary actions, active states, and critical branding. It provides high contrast against the light background to ensure accessibility.
- **Neutral/Text (#0F172A):** A near-black charcoal used for primary headings and body text to maximize readability.
- **Secondary/Muted (#64748B):** Used for metadata, labels, and secondary information that requires lower visual prominence.
- **Surfaces:** The global background is a cool-toned white (#F8FAFC), while primary content containers use pure white (#FFFFFF) to create a subtle layered effect without relying on heavy shadows.
- **Borders (#E2E8F0):** Precise, thin strokes define the grid and separate data sections without creating visual noise.

## Typography
The system uses **Inter** for all roles to maintain a unified, systematic feel. The type hierarchy avoids "oversized" elements, keeping headlines modest to allow for more content on-screen.

- **Headlines:** Use semi-bold weights with slight negative letter-spacing to appear compact and authoritative.
- **Body:** The 14px size is the workhorse for the platform, providing the best balance of density and legibility for long-form data.
- **Labels:** Small caps or medium-weight 12px type is used for form labels and table headers to distinguish them clearly from input data.
- **Monospace (Optional):** For ID numbers, procurement codes, or BIS standard references, use a system monospace font at 13px to aid in character recognition.

## Layout & Spacing
The spacing system follows a strict **4px baseline grid**. This design system favors high density to accommodate the information-rich nature of procurement documents.

- **Grid:** A 12-column fluid grid is used for desktop, constrained to a 1440px max-width to prevent line lengths from becoming unreadable.
- **Padding:** Internal card padding is set to `16px` (md) to maintain density while allowing enough "air" for document scanning.
- **Reflow:** On tablets, margins reduce to `16px`. On mobile, complex tables should transition to a list-card format, with horizontal scrolling enabled only for essential data columns.
- **Alignment:** All elements must align to the 4px grid. Avoid "center-aligned" layouts; use left-aligned content to mirror the reading pattern of official documents.

## Elevation & Depth
Depth is conveyed through **Low-contrast Outlines** and extremely subtle environmental shadows. This creates a "flat-plus" look that feels modern and stable.

- **Base Level:** Background (#F8FAFC).
- **Surface Level:** White cards (#FFFFFF) with a 1px border (#E2E8F0).
- **Elevation 1 (Active/Floating):** Used for dropdowns and popovers. Adds a small, sharp shadow: `0 1px 3px rgba(15, 23, 42, 0.08)`.
- **Elevation 2 (Modals):** Used for critical dialogs. Adds a more diffused shadow: `0 10px 25px -5px rgba(15, 23, 42, 0.1)`.
- **Interaction:** Hover states on interactive cards should not lift the element; instead, they should change the border color to a slightly darker grey (#CBD5E1) or add a subtle inner glow.

## Shapes
The shape language is professional and refined. A `roundedness` of `2` (8px for standard elements) is used to soften the technical nature of the content without appearing overly casual or "bubbly."

- **Standard Elements (8px):** Buttons, input fields, and small cards.
- **Large Containers (12-14px):** Main content areas or dashboard sections.
- **Small Elements (4px):** Checkboxes, tags, and internal nested components.
- **Icons:** Use a 2px stroke weight to match the thin border language of the UI.

## Components
Consistent styling across all components ensures the platform feels like a single, cohesive tool.

- **Buttons:**
    - **Primary:** Navy background, white text, no gradient.
    - **Secondary:** White background, 1px border (#E2E8F0), dark text.
    - **Ghost:** No background or border, used for utility actions in toolbars.
- **Input Fields:** 
    - Standard height of 36px for high density. Use 1px #E2E8F0 borders. Focused states use a 2px offset ring in Primary Navy.
- **Data Tables:** 
    - The core of the platform. Headers use #F8FAFC background with 11px uppercase labels. Rows have a subtle 1px bottom border. No zebra striping; use hover highlights instead.
- **Status Chips:** 
    - Use "Tonal" backgrounds (e.g., light green background with dark green text) for compliance status. Keep the border-radius small (4px) to maintain the professional aesthetic.
- **Audit Cards:** 
    - Used for showing compliance history. These should have a left-hand border accent (2px) to denote status color without filling the whole card.
- **Progress Indicators:** 
    - Thin linear bars (4px height) for multi-step procurement workflows, avoiding large circular gauges.