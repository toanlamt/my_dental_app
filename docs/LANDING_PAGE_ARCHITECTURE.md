# Landing Page Architecture — Refactor Proposal

> **Status**: Proposal draft (audit complete, implementation pending)  
> **Purpose**: Improve maintainability and facilitate future AI-assisted development  
> **Scope**: Public landing page only (`/`) — does not affect management system, backend, or routing

## 1. Current State Analysis

### 1.1 Files constituting the landing page

- **Frontend components**:
  - `src/pages/landing-page.tsx` (~300 lines) — single monolithic component with all sections
  - `src/layouts/public-layout.tsx` — header, footer, navigation (shared by all public pages)

- **Content & internationalization**:
  - `src/i18n/locales/en/common.ts` — English keys: `public.*`, `phase9.*`
  - `src/i18n/locales/vi/common.ts` — Vietnamese translations of common
  - `src/i18n/locales/en/public-pages.ts` — English keys: `publicPages.*`
  - `src/i18n/locales/vi/public-pages.ts` — Vietnamese (uses spread from EN to avoid duplication)
  - `src/data/public-data.ts` — service/doctor/faq metadata (slug, icon, tone)

### 1.2 Current structure and concerns

**The landing page (single component):**

```
LandingPage
├── Hero section
│   ├── Text (eyebrow, title, description)
│   ├── CTA buttons (hardcoded href="/book")
│   └── Hero image (hardcoded Unsplash URL)
├── Benefits bar
│   ├── Array of 4 benefits with icons
│   └── Icons hardcoded in a const array
├── Services section
│   ├── 6 service cards mapped from i18n
│   ├── Icon array (hardcoded, reused from benefits)
│   └── Links to service detail pages
├── About section
│   ├── About image (hardcoded Unsplash URL)
│   └── CTA linking to /about page
├── Doctors section
│   ├── 3 doctor cards
│   ├── Background colors hardcoded in indexed array
│   └── Doctor initials shown instead of images
├── Why section
│   ├── List of benefits (fetched from i18n)
│   └── Check icons (hardcoded)
├── FAQ section
│   ├── Expandable questions fetched from i18n
│   └── Chevron icons (hardcoded)
├── CTA section (yellow banner)
│   └── Generic call-to-action
└── Testimonials section
    ├── Quote cards mapped from i18n
    └── Placeholder text for job title
```

### 1.3 Identified maintenance issues

**Issue #1: Monolithic component**
- Single 300+ line component mixing layout, styling, icon management, and content fetching
- Difficult to modify one section without risking the entire component
- No clear boundaries or responsibilities
- Testing or refactoring any section requires understanding the whole file

**Issue #2: Hardcoded image URLs**
- Two Unsplash image URLs embedded in JSX
- If images need to change, must edit the component file
- No semantic meaning or alt text management alongside URLs
- Not easily extensible for A/B testing or CDN optimization

**Issue #3: Icon management scattered**
- Icon arrays (`icons`, `benefitIcons`) defined at module level
- Icon mappings repeated or indexed by position
- Coupling between icon arrays and content order
- Hard to add/remove/reorder services without breaking icon alignment

**Issue #4: Color hardcoding**
- Doctor section background colors hardcoded as indexed array `['bg-[#d9e8df]', 'bg-[#e8dfd5]', 'bg-[#d9e0e8]'][index]`
- No semantic meaning (which doctor has which background?)
- Fragile if doctor records change

**Issue #5: No semantic data separation**
- Content fetching via `t()` hooks scattered throughout JSX
- No single source of truth for "what is the structure of a service card"
- Future content changes require understanding i18n structure + component structure

**Issue #6: Content duplication opportunity in i18n**
- Vietnamese locale partially spreads English structure
- Future translations may introduce duplication patterns
- No clear convention for multilingual content structuring

**Issue #7: Future modifications are unclear**
- To "modify the landing page hero" — which file? How much context needed?
- To "add a new doctor to the home page" — where does data go?
- To "change the service icons" — multiple places to touch?

---

## 2. Proposed Architecture

### 2.1 Directory structure

```
src/
├── pages/
│   └── landing-page.tsx
│       (landing page route, minimal responsibility)
│
├── components/
│   └── landing/
│       ├── LandingPage.tsx          (main container, orchestrates sections)
│       ├── HeroSection.tsx
│       ├── BenefitsBar.tsx
│       ├── ServicesSection.tsx
│       ├── AboutSection.tsx
│       ├── DoctorsSection.tsx
│       ├── WhySection.tsx
│       ├── FaqSection.tsx
│       ├── CtaSection.tsx
│       └── TestimonialsSection.tsx
│
├── data/
│   └── landing/
│       ├── images.ts               (image URLs, alt text, dimensions)
│       ├── doctors.ts              (doctor card styling, doctor data structure)
│       └── index.ts                (exports all landing data)
│
└── i18n/
    └── locales/
        ├── en/
        │   ├── common.ts           (existing, no change needed)
        │   └── public-pages.ts     (existing, no change needed)
        └── vi/
            ├── common.ts
            └── public-pages.ts
```

### 2.2 Responsibility boundaries

**`src/pages/landing-page.tsx`**
- Route component (lazy loaded by AppRouter)
- Imports LandingPage component and wraps in PublicLayout (via AppRouter)
- Minimal responsibility: just render

**`src/components/landing/LandingPage.tsx`**
- Main container component
- Orchestrates all landing sections
- Calls usePageMeta for SEO
- Responsible for: "put all sections together, in order"
- No styling or content logic — delegates to children

**`src/components/landing/HeroSection.tsx`**
- Hero: eyebrow, title, description, CTA buttons, hero image
- Responsibility: "display hero content"
- Imports image data from `src/data/landing/images`
- Uses i18n for text

**`src/components/landing/BenefitsBar.tsx`**
- Benefits row with 4 benefit cards
- Responsibility: "display benefits grid"
- Icon selection logic localized here
- Content fetched from i18n (`public.benefits.items`)

**`src/components/landing/ServicesSection.tsx`**
- Service cards (6 items, maps from i18n)
- Responsibility: "display services in a grid"
- Icon-to-service mapping in component (not global)
- Links to `/services/:slug`

**`src/components/landing/AboutSection.tsx`**
- About text block + image
- CTA link to `/about`
- Image data from `src/data/landing/images`

**`src/components/landing/DoctorsSection.tsx`**
- Doctor cards (3 items)
- Responsibility: "display doctors in a grid"
- Doctor styling (backgrounds, initials) in `src/data/landing/doctors.ts`

**`src/components/landing/WhySection.tsx`**
- Why section (dark background, list of reasons)
- Icon-to-benefit mapping
- Content from i18n

**`src/components/landing/FaqSection.tsx`**
- Expandable FAQ items
- Icon management
- Content from i18n

**`src/components/landing/CtaSection.tsx`**
- Yellow banner CTA section
- Link to `/book`

**`src/components/landing/TestimonialsSection.tsx`**
- Testimonial cards (quote cards)
- Content from i18n

### 2.3 Data files

**`src/data/landing/images.ts`**
```typescript
export const landingImages = {
  hero: {
    src: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?...',
    alt: 'public.hero.imageAlt', // i18n key
    width: 900,
    height: 1125,
    fetchPriority: 'high' as const,
    sizes: '(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw',
  },
  about: {
    src: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?...',
    alt: 'public.about.imageAlt',
    width: 900,
    height: 720,
    sizes: '(min-width: 1024px) 44vw, (min-width: 640px) 70vw, 92vw',
  },
};
```

**`src/data/landing/doctors.ts`**
```typescript
export const doctorCardStyling = {
  'ngoc-hieu': { bgTone: 'bg-[#d9e8df]' },
  'jordan-lee': { bgTone: 'bg-[#e8dfd5]' },
  'sam-taylor': { bgTone: 'bg-[#d9e0e8]' },
};
```

---

## 3. Implementation approach

### 3.1 Principles

1. **Preserve visual appearance** — refactor should not change how the landing page looks or behaves
2. **Preserve responsive behavior** — mobile, tablet, desktop all work the same
3. **Preserve EN/VI internationalization** — both languages work, same content structure
4. **Preserve routing and links** — `/book`, `/about`, etc. all work
5. **Preserve SEO** — page meta, canonical, og tags unchanged
6. **Preserve accessibility** — focus, labels, alt text all maintained

### 3.2 Implementation phases

**Phase A: Create component directory structure**
- Create `src/components/landing/` directory
- Create empty section components (placeholders)

**Phase B: Extract data**
- Extract image URLs and metadata to `src/data/landing/images.ts`
- Extract doctor styling to `src/data/landing/doctors.ts`
- Verify no functional changes

**Phase C: Extract sections one by one**
- Start with HeroSection (simplest, least coupled)
- Then BenefitsBar, AboutSection
- Then ServicesSection, DoctorsSection, etc.
- After each extraction: verify appearance, test i18n, run typecheck

**Phase D: Create orchestrator**
- Create `src/components/landing/LandingPage.tsx` that imports all sections
- Import into `src/pages/landing-page.tsx`
- Verify full page renders identically

**Phase E: Verify and document**
- Run `npm run typecheck`, `npm run lint`, `npm run build`
- Manual browser testing: desktop, tablet, mobile
- Test language switching (EN/VI)
- Test navigation and links

---

## 4. Future maintainability guidelines

After refactoring, here's how to modify the landing page:

### "Modify the landing page hero"
→ Edit `src/components/landing/HeroSection.tsx`  
→ Modify text via `src/i18n/locales/{en,vi}/common.ts` (keys: `public.hero.*`)  
→ Modify image via `src/data/landing/images.ts` (key: `hero`)

### "Add a new service card to the landing"
→ Add to i18n: `src/i18n/locales/en/public-pages.ts` → `publicPages.services.items`  
→ Add icon mapping in `src/components/landing/ServicesSection.tsx`  
→ Component automatically renders the new service

### "Change a doctor's bio on the landing"
→ Modify `src/i18n/locales/{en,vi}/public-pages.ts`  
→ Key: `publicPages.doctors.items.[doctor-slug].bio`

### "Change the Vietnamese testimonial copy"
→ Edit `src/i18n/locales/vi/common.ts`  
→ Key: `public.testimonials.items`

### "Replace the hero image"
→ Edit `src/data/landing/images.ts`  
→ Update `hero.src`, `width`, `height`, `sizes`

### "Modify FAQ section styling"
→ Edit `src/components/landing/FaqSection.tsx`  
→ No need to touch data or other sections

---

## 5. Benefits of this architecture

1. **Localized changes** — modify one section without risking others
2. **Clear responsibility** — each component has one job
3. **Semantic data** — image URLs have context (hero, about, etc.)
4. **Future AI maintainability** — prompts can reference specific files and sections
5. **Testability** — sections can be tested independently (in a future test suite)
6. **Extensibility** — adding a new section requires creating one component + i18n keys
7. **Reduced cognitive load** — developer only needs to understand one section at a time
8. **Cleaner diffs** — future changes show exactly what changed, not a wall of code

---

## 6. Migration checklist

- [ ] Create `src/components/landing/` directory
- [ ] Create `src/data/landing/` directory
- [ ] Extract images to `src/data/landing/images.ts`
- [ ] Extract doctor styling to `src/data/landing/doctors.ts`
- [ ] Create HeroSection.tsx, extract hero logic
- [ ] Create BenefitsBar.tsx, extract benefits logic
- [ ] Create AboutSection.tsx, extract about logic
- [ ] Create ServicesSection.tsx, extract services logic
- [ ] Create DoctorsSection.tsx, extract doctors logic
- [ ] Create WhySection.tsx, extract why logic
- [ ] Create FaqSection.tsx, extract faq logic
- [ ] Create CtaSection.tsx, extract cta logic
- [ ] Create TestimonialsSection.tsx, extract testimonials logic
- [ ] Create LandingPage.tsx (orchestrator), import all sections
- [ ] Update `src/pages/landing-page.tsx` to import new LandingPage
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm run lint` passes
- [ ] Verify `npm run build` passes
- [ ] Manual browser testing (desktop, tablet, mobile, EN/VI)
- [ ] Update `docs/AI_CONTEXT.md` with new architecture

---

## 7. Notes

- **No feature changes**: This is refactoring only. No new functionality is added.
- **Backward compatible**: The landing page URL and behavior remain unchanged.
- **No i18n changes needed**: Existing keys and structure preserved. No translation updates required.
- **PublicLayout unchanged**: Header, footer, navigation remain in `src/layouts/public-layout.tsx`.
- **Public pages unaffected**: `src/pages/public-pages.tsx` (services detail, doctor detail, etc.) not included in this refactor.
