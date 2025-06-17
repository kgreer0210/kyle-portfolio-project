# Design System Implementation

## Overview

This document outlines the comprehensive design system implemented for Kyle's Portfolio using Tailwind CSS v4 and a custom dark mode color palette.

## Color Palette

### Main Backgrounds

- **Rich Black** (`#040f16`): Primary, darkest background for the main body
- **Oxford Blue** (`#000022`): Secondary background for cards, containers, header, and footer

### UI & Interactive Colors

- **Penn Blue** (`#001242`): Borders, subtle UI elements, secondary hover states
- **Lapis Lazuli** (`#005e7c`): Primary hover/focus color, secondary accents
- **Blue NCS** (`#0094c6`): Main accent color for CTAs, links, and highlights

### Text Colors

- **Text Primary** (`#e0e6f0`): Body copy and standard text
- **Text Secondary** (`#a8b2d1`): Less important text, subtitles, placeholders
- **Text Headings** (`#ffffff`): Pure white for main headings to make them pop

## Implementation Details

### Tailwind CSS v4 Integration

The design system uses Tailwind CSS v4's new `@theme` directive to define custom color variables:

```css
@theme {
  /* Custom Color Palette */
  --color-rich-black: #040f16;
  --color-oxford-blue: #000022;
  --color-penn-blue: #001242;
  --color-lapis-lazuli: #005e7c;
  --color-blue-ncs: #0094c6;
  --color-text-primary: #e0e6f0;
  --color-text-secondary: #a8b2d1;
  --color-text-headings: #ffffff;
}
```

### CSS Variable Usage

Colors are referenced using Tailwind v4's new syntax:

- `bg-(--color-rich-black)` for backgrounds
- `text-(--color-text-primary)` for text colors
- `border-(--color-penn-blue)` for borders

### Global Styles

#### Typography

- **Headings**: Use `--text-headings` (white) for maximum contrast
- **Main H1**: Uses `--blue-ncs` for brand consistency
- **Body Text**: Uses `--text-primary` for optimal readability
- **Secondary Text**: Uses `--text-secondary` for hierarchy

#### Interactive Elements

##### Buttons

- **Primary Button**:
  - Background: `--blue-ncs`
  - Text: `--text-headings`
  - Hover: `--lapis-lazuli`
- **Secondary Button**:
  - Background: Transparent
  - Border: `--blue-ncs`
  - Text: `--blue-ncs`
  - Hover: Background `--penn-blue`, Text `--text-headings`

##### Links

- Default: `--blue-ncs`
- Hover: Underline decoration
- Navigation links: `--text-secondary` with hover to `--text-primary`

##### Form Inputs

- Background: `--rich-black`
- Text: `--text-primary`
- Border: `--penn-blue`
- Focus: 2px solid `--blue-ncs`

#### Layout Components

##### Cards and Containers

- Background: `--oxford-blue`
- Border: 1px solid `--penn-blue`
- Used for: Project cards, about section, contact section

##### Header and Footer

- Background: `--oxford-blue`
- Borders: `--penn-blue`
- Creates visual separation from main content

### Responsive Design

The design system includes responsive breakpoints:

- Mobile-first approach
- Flexible grid layouts
- Responsive typography scaling
- Adaptive button and spacing

### Transitions and Animations

All interactive elements include smooth transitions:

- Duration: 300ms (0.3s)
- Easing: Default ease function
- Properties: `all` for comprehensive state changes

## Usage Guidelines

### Do's

- ✅ Use the defined color variables consistently
- ✅ Apply the 0.3s transition to interactive elements
- ✅ Follow the typography hierarchy
- ✅ Use cards for content grouping
- ✅ Maintain proper contrast ratios

### Don'ts

- ❌ Don't introduce new colors outside the palette
- ❌ Don't skip transitions on interactive elements
- ❌ Don't use arbitrary color values
- ❌ Don't break the visual hierarchy

## File Structure

```
src/
├── app/
│   ├── globals.css          # Design system implementation
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Main portfolio page
└── DESIGN_SYSTEM.md         # This documentation
```

## Browser Support

- Modern browsers supporting CSS custom properties
- Tailwind CSS v4 compatibility
- Next.js 15+ optimization

## Future Enhancements

- Dark/light mode toggle
- Additional component variants
- Animation library integration
- Extended color palette for specific use cases
