# CSS Modules Guide

## When to Use CSS Modules vs Tailwind

### ✅ Use Tailwind for:
- Layout (flex, grid, padding, margin)
- Typography (font-size, font-weight, color)
- Simple colors and backgrounds
- Responsive design (sm:, md:, lg:)
- Common states (hover:, focus:, dark:)

### ✅ Use CSS Modules for:
- Complex animations with multiple keyframes
- Multi-stop gradients
- SVG styling and interactions
- Component-specific effects (shimmer, confetti)
- Styles that need JS control (dynamic classes)

## File Structure

```
frontend/src/
├── styles/
│   └── animations.module.css    # Shared animations
├── components/
│   ├── RoomCard.tsx
│   ├── RoomCard.module.css      # Component-specific styles
│   ├── HouseView.tsx
│   └── HouseView.module.css
└── pages/
    ├── LoginPage.tsx
    └── LoginPage.module.css
```

## Usage Examples

### Importing and Using CSS Modules

```tsx
// Component.tsx
import styles from './Component.module.css';

export const Component = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>Content</div>
    </div>
  );
};
```

### Combining with Tailwind

```tsx
import styles from './Component.module.css';

export const Component = () => {
  return (
    // Tailwind for layout, CSS Module for animation
    <div className={`p-4 flex ${styles.fadeIn}`}>
      <button className={`btn-primary ${styles.submitButton}`}>
        Submit
      </button>
    </div>
  );
};
```

### Using Shared Animations

```tsx
import animations from '../styles/animations.module.css';

export const List = ({ items }) => {
  return (
    <ul>
      {items.map((item, i) => (
        <li 
          key={item.id}
          className={`${animations.fadeInUp} ${animations[`stagger${i + 1}`]}`}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

### Conditional Classes

```tsx
import styles from './Card.module.css';
import clsx from 'clsx'; // or classnames

export const Card = ({ isComplete }) => {
  return (
    <div className={clsx(
      styles.card,
      isComplete && styles.completed
    )}>
      Content
    </div>
  );
};
```

## Available CSS Modules

### `LoginPage.module.css`
- `.doorContainer` - Door background wrapper
- `.door` - Wood door effect with grain texture
- `.doorHandle` - Animated door handle
- `.signContainer` - Welcome sign wrapper
- `.sign` - Ellipse sign with swing animation
- `.submitButton` - Button with shimmer effect
- `.errorShake` - Error shake animation

### `HouseView.module.css`
- `.container` - Main container
- `.svgWrapper` - SVG container with shadow
- `.roomHoverable` - Room hover state
- `.roomSelected` - Room selection pulse
- `.tooltip` - Room tooltip
- `.statusIndicator` - Task completion indicator

### `RoomCard.module.css`
- `.card` - Card with gradient background
- `.progressContainer` - Progress bar wrapper
- `.progressBar` - Animated progress with shimmer
- `.completed` - Completion celebration effect
- `.confettiContainer` - Confetti animation wrapper
- `.skeleton` - Loading skeleton state

### `animations.module.css` (shared)
Entrance:
- `.fadeIn`, `.fadeInUp`, `.fadeInDown`
- `.slideInRight`, `.slideInLeft`
- `.scaleIn`, `.bounceIn`

Exit:
- `.fadeOut`, `.slideOutRight`, `.slideOutLeft`, `.scaleOut`

Attention:
- `.shake`, `.pulse`, `.bounce`, `.wiggle`, `.heartbeat`

Loading:
- `.spin`, `.dots`, `.progressPulse`

Success/Error:
- `.checkmark`, `.errorX`, `.confetti`

Stagger delays:
- `.stagger1` through `.stagger10` (50ms increments)

## Best Practices

### 1. Keep Modules Small
Each CSS Module should only contain styles specific to its component.

### 2. Use @apply for Tailwind Integration
```css
/* Component.module.css */
.container {
  @apply p-4 rounded-lg shadow-md;
  /* Custom styles that Tailwind can't do */
  background: linear-gradient(135deg, #fff, #f0f0f0);
}
```

### 3. Respect Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .animation {
    animation: none !important;
  }
}
```

### 4. TypeScript Support
Vite automatically generates types for CSS Modules:
```tsx
// Types are inferred
import styles from './Component.module.css';
styles.container // ✓ string
styles.nonExistent // ✗ TypeScript error
```

### 5. Scoped by Default
CSS Modules are automatically scoped, so no need for BEM naming:
```css
/* This becomes .Card_container_abc123 in production */
.container { ... }
```

## Performance Tips

1. **Lazy Load Heavy Animations**
   ```tsx
   const AnimatedComponent = lazy(() => import('./AnimatedComponent'));
   ```

2. **Use `will-change` Sparingly**
   ```css
   .heavyAnimation {
     will-change: transform, opacity;
   }
   ```

3. **Prefer `transform` and `opacity`**
   These are GPU-accelerated and don't trigger layout.

4. **Batch Class Changes**
   ```tsx
   // Bad - multiple reflows
   element.classList.add('a');
   element.classList.add('b');
   
   // Good - single reflow
   element.classList.add('a', 'b');
   ```
