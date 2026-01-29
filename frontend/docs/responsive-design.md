# Responsive Design Guide

## Breakpoints

| Name | Width | Use Case |
|------|-------|----------|
| `xs` | 475px | Small phones |
| `sm` | 640px | Large phones / Small tablets |
| `md` | 768px | Tablets portrait |
| `lg` | 1024px | Tablets landscape / Small laptops |
| `xl` | 1280px | Laptops / Desktops |
| `2xl` | 1536px | Large desktops |
| `3xl` | 1920px | Full HD monitors |
| `4xl` | 2560px | QHD / 4K monitors |

### Special Breakpoints

```html
<!-- Touch devices -->
<div class="touch:p-4 mouse:p-2">...</div>

<!-- Orientation -->
<div class="portrait:flex-col landscape:flex-row">...</div>
```

## Fluid Typography

Use `text-fluid-*` classes for text that scales smoothly:

```html
<!-- Scales from 30px (mobile) to 40px (desktop) -->
<h1 class="text-fluid-3xl">כותרת ראשית</h1>

<!-- Scales from 24px to 32px -->
<h2 class="text-fluid-2xl">כותרת משנית</h2>

<!-- Scales from 16px to 18px -->
<p class="text-fluid-base">טקסט רגיל</p>
```

| Class | Mobile | Desktop | Use |
|-------|--------|---------|-----|
| `text-fluid-xs` | 12px | 14px | Captions |
| `text-fluid-sm` | 14px | 16px | Small text |
| `text-fluid-base` | 16px | 18px | Body text |
| `text-fluid-lg` | 18px | 20px | Large body |
| `text-fluid-xl` | 20px | 24px | Small headings |
| `text-fluid-2xl` | 24px | 32px | Section headings |
| `text-fluid-3xl` | 30px | 40px | Page titles |
| `text-fluid-4xl` | 36px | 48px | Hero titles |
| `text-fluid-5xl` | 48px | 64px | Display text |

### Custom Fluid Text

```html
<!-- Using CSS variables -->
<h1 class="text-fluid-title">כותרת</h1>
<h2 class="text-fluid-subtitle">תת-כותרת</h2>
<p class="text-fluid-body">טקסט גוף</p>
```

## Responsive Grids

### Auto-fit Grid (Recommended)

```html
<!-- Cards automatically fit, min 280px each -->
<div class="grid-auto-fit">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Smaller cards (min 200px) -->
<div class="grid-auto-fit-sm">...</div>

<!-- Larger cards (min 350px) -->
<div class="grid-auto-fit-lg">...</div>
```

### Explicit Responsive Grid

```html
<div class="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-responsive">
  ...
</div>
```

### Card Grid Component

```html
<!-- Built-in responsive card grid -->
<div class="grid-cards">
  <div>Card 1</div>
  <div>Card 2</div>
</div>
```

## Responsive Spacing

### Fluid Padding

```html
<!-- Padding that scales with viewport -->
<div class="p-responsive">...</div>
<div class="px-responsive">...</div>
<div class="py-responsive">...</div>
```

### Fluid Gap

```html
<div class="flex gap-responsive">...</div>
<div class="grid gap-responsive-lg">...</div>
```

### CSS Variables

```css
.custom {
  padding: var(--space-4);  /* clamp(1rem, 2vw, 2rem) */
  gap: var(--space-3);      /* clamp(0.75rem, 1.5vw, 1.5rem) */
}
```

## Touch Optimization

### Touch Targets

```html
<!-- Minimum 44x44px touch target -->
<button class="touch-target">Click me</button>

<!-- Larger 48x48px target -->
<button class="touch-target-lg">Click me</button>
```

### Touch vs Mouse Styles

```html
<!-- Only apply hover effect on mouse devices -->
<div class="mouse:hover:scale-105 touch:active:scale-95">
  Card
</div>
```

## Container Queries

For component-level responsive design:

```html
<!-- Enable container queries on parent -->
<div class="container-query">
  <!-- Children respond to container width, not viewport -->
  <div class="cq:flex-row cq:grid-cols-2">
    ...
  </div>
</div>
```

## Safe Areas (Mobile)

```html
<!-- Account for notches and home indicators -->
<header class="safe-area-inset-top">...</header>
<footer class="safe-area-inset-bottom">...</footer>
```

## 4K Display Optimization

On 4K displays (2560px+):
- Base font size increases to 1.25rem
- Spacing scales up proportionally
- Touch targets increase to 52x52px

```html
<!-- Explicit 4K handling -->
<div class="4xl:text-xl 4xl:p-8 4xl:gap-6">
  Large screen content
</div>
```

## Best Practices

### 1. Mobile-First

```html
<!-- Start with mobile, add larger breakpoints -->
<div class="flex-col md:flex-row">...</div>
```

### 2. Use Fluid Over Fixed

```html
<!-- Good - scales smoothly -->
<h1 class="text-fluid-3xl">Title</h1>

<!-- Less ideal - jumps between sizes -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

### 3. Auto-fit for Unknown Content

```html
<!-- Good - adapts to content -->
<div class="grid-auto-fit">...</div>

<!-- Less flexible - fixed columns -->
<div class="grid grid-cols-3">...</div>
```

### 4. Test Touch Targets

Minimum 44x44px for touch targets. Use browser DevTools to emulate touch devices.

### 5. Consider Reading Width

```html
<!-- Limit line length for readability -->
<p class="max-w-readable">Long text content...</p>
```

## Testing

### Browser DevTools

1. Open DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Test common devices: iPhone SE, iPad, iPad Pro
3. Test 4K: Custom 2560x1440 resolution
4. Toggle touch emulation

### Key Test Points

- 320px (iPhone SE)
- 375px (iPhone 12/13/14)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1280px (Laptop)
- 1920px (Full HD)
- 2560px (4K)

### Orientation Testing

Rotate device/emulator to test:
- Portrait navigation
- Landscape data tables
- Form layouts in both orientations
