# Dark Mode Implementation Guide

## Overview
This document outlines the dark mode implementation pattern used throughout the application. All pages should follow this pattern to ensure consistent dark mode support.

## Color Mapping

### Text Colors
- `text-gray-800` → `text-gray-800 dark:text-white`
- `text-gray-700` → `text-gray-700 dark:text-gray-300`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`
- `text-gray-500` → `text-gray-500 dark:text-gray-500` (usually stays same)
- `text-gray-400` → `text-gray-400 dark:text-gray-600`

### Background Colors
- `bg-white` → `bg-white dark:bg-gray-800`
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-700/50`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-700`
- `bg-gray-200` → `bg-gray-200 dark:bg-gray-600`

### Border Colors
- `border-gray-200` → `border-gray-200 dark:border-gray-700`
- `border-gray-300` → `border-gray-300 dark:border-gray-600`

### Status/Badge Colors
- `bg-green-100 text-green-700` → `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`
- `bg-blue-100 text-blue-700` → `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400`
- `bg-yellow-100 text-yellow-700` → `bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400`
- `bg-red-100 text-red-700` → `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`

### Icon Colors
- `text-blue-600` → `text-blue-600 dark:text-blue-400`
- `text-green-600` → `text-green-600 dark:text-green-400`
- `text-yellow-600` → `text-yellow-600 dark:text-yellow-400`
- `text-purple-600` → `text-purple-600 dark:text-purple-400`

## Common Patterns

### Cards
```jsx
<div className="card">
  {/* Card content */}
</div>
```
The `.card` class already has dark mode support.

### Buttons
```jsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
```
Button classes already have dark mode support.

### Input Fields
```jsx
<input className="input-field" />
```
Input fields already have dark mode support.

### Modals
```jsx
<div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50">
  <div className="bg-white dark:bg-gray-800 rounded-2xl">
    {/* Modal content */}
  </div>
</div>
```

## Checklist for Each Page

- [ ] All text colors have dark mode variants
- [ ] All background colors have dark mode variants
- [ ] All border colors have dark mode variants
- [ ] All status/badge colors have dark mode variants
- [ ] All icon colors have dark mode variants
- [ ] Modals have dark mode support
- [ ] Empty states have dark mode support
- [ ] Loading states have dark mode support
- [ ] Hover states work in both modes

## Files Updated
- ✅ GroupAdminLearnGrow.jsx
- ✅ Layout.jsx
- ✅ NotificationDropdown.jsx
- ✅ LanguageSelector.jsx
- ✅ SearchModal.jsx
- ✅ GroupAdminSettings.jsx

## Files Still Needing Updates
All other page files in `FrontEnd/src/pages/` need to be updated following this pattern.

