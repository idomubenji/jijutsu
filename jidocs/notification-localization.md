# Notification Localization & Positioning

## Overview

This document explains how we fixed the localization and positioning of the kanji discovery notification box in the game. The notification appears when a user successfully combines radicals to create a new kanji character.

## Issues Addressed

1. **Localization Issue**: The notification text was always showing in English ("You created a new kanji!") even when the user had selected Japanese language.
2. **Positioning Issue**: The notification was centered on the screen, which could overlap with UI elements like the sidebar.

## Implementation Details

### Localization Fix

The localization issue was fixed by ensuring that the translation function is applied directly in the JSX when rendering the notification, rather than only when creating the notification:

```tsx
// Before: Only translated when the notification was created
message = t('success.combination');

// After: Translation applied during each render
{notification.type === 'success' && notification.kanji ? (
  <span>{t('success.combination')}</span>
) : (
  <span>{notification.message}</span>
)}
```

This ensures that:
- The message is translated on every render
- When language is changed, existing notifications are updated immediately
- The translation key 'success.combination' is used directly in the display logic

The translation keys were already defined in the LanguageContext:
- English: "You created a new kanji!"
- Japanese: "新しい漢字を作成しました！"

### Positioning Fix

The notification positioning was adjusted from being centered to left-aligned by modifying the CSS classes:

```tsx
// Before: Centered positioning
<div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">

// After: Left-aligned positioning
<div className="fixed top-24 left-4 z-50 flex flex-col gap-2 items-start">
```

Changes made:
1. Removed `left-1/2` and `-translate-x-1/2` which were horizontally centering the notifications
2. Added `left-4` to position the notifications 1rem (16px) from the left edge
3. Changed `items-center` to `items-start` to left-align the content within the notification container

### Animation

The notification uses a custom "slideIn" animation added to the Tailwind configuration:

```js
// In tailwind.config.js
keyframes: {
  "slideIn": {
    from: { transform: "translateY(-20px)", opacity: 0 },
    to: { transform: "translateY(0)", opacity: 1 },
  },
},
animation: {
  "slideIn": "slideIn 0.3s ease-out",
},
```

## Result

The notifications now:
1. Display properly in the selected language (English or Japanese)
2. Appear left-aligned without overlapping other interface elements
3. Animate smoothly with a slide-in effect from top to bottom
4. Update immediately when the language is changed

## Files Modified

1. `src/app/game/page.tsx` - Updated notification rendering and positioning
2. `tailwind.config.js` - Added slideIn animation definition 