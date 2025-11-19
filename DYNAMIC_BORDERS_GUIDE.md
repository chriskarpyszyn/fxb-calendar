# Dynamic Borders Guide

## Overview

The Dynamic Border component provides animated, customizable borders for windows and frames in the stream overlay. It features pulsing glow effects, color transitions, and optional particle animations.

## Component API

### Basic Usage

```jsx
import DynamicBorder from './components/DynamicBorder';

<DynamicBorder color="#f472b6" animated={true} pulse="2s" glow={0.5}>
  <div>Your content here</div>
</DynamicBorder>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | string | `'#f472b6'` | Base border color (hex, rgb, or CSS color name) |
| `animated` | boolean | `true` | Enable/disable animations |
| `pulse` | string | `'2s'` | Pulse animation duration (CSS time value) |
| `glow` | number | `0.5` | Glow intensity (0-1) |

### Examples

#### Basic Animated Border

```jsx
<DynamicBorder color="#f472b6" animated={true}>
  <div className="content-window">Game Capture</div>
</DynamicBorder>
```

#### Custom Color and Speed

```jsx
<DynamicBorder 
  color="#22d3ee" 
  animated={true} 
  pulse="1.5s" 
  glow={0.8}
>
  <div className="camera-window">Webcam</div>
</DynamicBorder>
```

#### Static Border (No Animation)

```jsx
<DynamicBorder color="#a78bfa" animated={false}>
  <div>Static content</div>
</DynamicBorder>
```

## Color Options

### Predefined Colors

The overlay uses a retro futuristic color palette. Common colors:

- **Pink**: `#f472b6` (default, matches overlay theme)
- **Cyan**: `#22d3ee` (retro cyan accent)
- **Purple**: `#a78bfa` (muted purple)
- **Green**: `#34d399` (muted green)
- **Blue**: `#60a5fa` (muted blue)

### Custom Colors

You can use any CSS color value:

```jsx
// Hex
<DynamicBorder color="#ff6b9d" />

// RGB
<DynamicBorder color="rgb(255, 107, 157)" />

// RGBA
<DynamicBorder color="rgba(255, 107, 157, 0.8)" />

// Named colors
<DynamicBorder color="hotpink" />
```

## Animation Effects

### Pulse Animation

The border pulses with a glow effect that intensifies and fades:

- **Duration**: Controlled by `pulse` prop (e.g., `"2s"`, `"1.5s"`, `"3s"`)
- **Effect**: Border glow intensity and scale change over time
- **Default**: 2 seconds per pulse cycle

### Glow Effect

The glow intensity is controlled by the `glow` prop:

- **0.0**: No glow (border only)
- **0.5**: Moderate glow (default)
- **1.0**: Maximum glow intensity

### Sweep Animation

A light sweep moves across the border continuously:

- **Speed**: Automatically synchronized with pulse duration
- **Effect**: Creates a "scanning" light effect
- **Direction**: Left to right, top to bottom

### Particle Effect

Small particles move along the border edges:

- **Pattern**: Radial gradients at border corners
- **Animation**: Particles move along border perimeter
- **Speed**: 3 seconds per full cycle

## Customization

### Modifying Animation Speed

```jsx
// Faster pulse (1 second)
<DynamicBorder pulse="1s" />

// Slower pulse (4 seconds)
<DynamicBorder pulse="4s" />
```

### Adjusting Glow Intensity

```jsx
// Subtle glow
<DynamicBorder glow={0.3} />

// Bright glow
<DynamicBorder glow={0.9} />
```

### Disabling Specific Effects

To disable animations entirely:

```jsx
<DynamicBorder animated={false} />
```

To customize individual effects, edit `src/components/DynamicBorder.jsx`:

```jsx
// Disable sweep animation
.dynamic-border.animated::after {
  display: none; /* Add this */
}

// Disable particle effect
.dynamic-border.animated {
  background-image: none; /* Remove background-image */
}
```

## Advanced Customization

### Custom Border Width

Edit the component styles:

```css
.dynamic-border {
  border-width: 3px; /* Change from 2px */
}
```

### Custom Border Radius

```css
.dynamic-border {
  border-radius: 12px; /* Change from 8px */
}
```

### Multiple Border Colors

For gradient borders, modify the component:

```jsx
// In DynamicBorder.jsx, add gradient support
const borderStyle = {
  '--border-color': color,
  '--border-color-2': '#a78bfa', // Second color
  // ...
};
```

Then use in CSS:

```css
border-image: linear-gradient(45deg, var(--border-color), var(--border-color-2)) 1;
```

### Custom Animation Timing

Modify keyframe animations in the component:

```css
@keyframes borderPulse {
  0%, 100% {
    /* Custom start/end states */
  }
  50% {
    /* Custom peak state */
  }
}
```

## Performance Considerations

### GPU Acceleration

The animations use CSS transforms and opacity changes which are GPU-accelerated. However:

- **Too many animated borders**: Can impact performance
- **Complex animations**: May cause frame drops
- **Recommendation**: Limit to 2-3 animated borders per overlay

### Optimization Tips

1. **Reduce animation complexity**: Use simpler effects
2. **Lower refresh rates**: Increase `pulse` duration
3. **Disable on low-end devices**: Use `animated={false}` conditionally
4. **Use will-change**: Add `will-change: transform` for smoother animations

## Troubleshooting

### Border Not Visible

1. Check that `color` prop is set correctly
2. Verify border width is not 0
3. Check z-index if content is covering border

### Animation Not Working

1. Verify `animated={true}` is set
2. Check browser console for CSS errors
3. Ensure CSS animations are supported

### Performance Issues

1. Reduce number of animated borders
2. Increase `pulse` duration (slower = less CPU)
3. Disable particle effects if needed
4. Check browser performance profiler

## Examples in Overlay

The overlay uses dynamic borders in two places:

1. **Main Content Window** (`StreamOverlayFull.jsx`):
   ```jsx
   <DynamicBorder color="#f472b6" animated={true} pulse="2s" glow={0.5}>
     <div className="content-window-placeholder" />
   </DynamicBorder>
   ```

2. **Camera Window** (`StreamOverlayFull.jsx`):
   ```jsx
   <DynamicBorder color="#f472b6" animated={true} pulse="2s" glow={0.5}>
     <div className="camera-window-placeholder" />
   </DynamicBorder>
   ```

## Best Practices

1. **Consistent Colors**: Use the same color scheme across borders
2. **Appropriate Speed**: Match animation speed to stream pace
3. **Accessibility**: Ensure borders don't distract from content
4. **Testing**: Test on actual stream setup before going live
5. **Fallbacks**: Provide static borders for low-end devices

## Next Steps

- Experiment with different colors and speeds
- Test performance on your streaming setup
- Customize to match your brand/theme
- Consider adding border color transitions based on events

