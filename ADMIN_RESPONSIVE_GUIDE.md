# GoMirai Admin Panel - Responsive Design Guide

## 📱 Responsive Breakpoints

The admin panel is fully responsive with three main breakpoints:

### Desktop (> 1024px)
- **Sidebar**: Fixed left sidebar (260px width)
- **Layout**: Full desktop experience
- **Navigation**: Vertical menu with labels
- **Table**: Full width with all columns visible

### Tablet (768px - 1024px)
- **Sidebar**: Narrower left sidebar (220px width)
- **Layout**: Slightly compressed
- **Navigation**: Vertical menu with labels
- **Table**: Slightly smaller fonts

### Mobile (< 768px)
- **Sidebar**: **Bottom navigation bar** (tabbar)
- **Layout**: Full-screen content
- **Navigation**: Horizontal bottom bar with icons + labels
- **Table**: Horizontal scroll enabled

### Extra Small Mobile (< 480px)
- **Sidebar**: Compact bottom bar
- **Layout**: Minimal padding
- **Navigation**: Smaller icons and labels
- **Table**: Optimized for small screens

---

## 🎨 Mobile Layout Changes

### Bottom Navigation Bar (< 768px)

**Position**: 
- Fixed at bottom of screen
- Replaces left sidebar
- Always visible while scrolling

**Structure**:
```
┌─────────────────────────────────────┐
│          Header (Sticky)            │
├─────────────────────────────────────┤
│                                     │
│          Content Area               │
│        (Scrollable)                 │
│                                     │
│         padding-bottom: 80px        │
│                                     │
├─────────────────────────────────────┤
│  [Icon] [Icon] [Icon]  <- Bottom    │
│  Duyệt  Quản lý Giá    <- Nav Bar   │
└─────────────────────────────────────┘
```

**Features**:
- 🎯 Horizontal layout with 3 menu items
- 📍 Icons centered above labels
- 🔵 Active state with bottom border (3px green)
- 🔴 Badge notifications (top-right corner)
- ⚡ Touch-friendly (min 44px target size)

---

## 🔧 Technical Details

### CSS Media Queries

```css
/* Tablet */
@media (max-width: 1024px) {
  .admin-sidebar { width: 220px; }
  .admin-main { margin-left: 220px; }
}

/* Mobile */
@media (max-width: 768px) {
  /* Sidebar becomes bottom nav */
  .admin-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    flex-direction: row;
  }

  /* Hide logo */
  .admin-logo { display: none; }

  /* Horizontal menu */
  .admin-menu {
    flex-direction: row;
    justify-content: space-around;
  }

  /* Menu items */
  .menu-item {
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border-bottom: 3px solid transparent;
  }

  .menu-item.active {
    border-bottom: 3px solid #00b386;
  }

  /* Main content */
  .admin-main {
    margin-left: 0;
    padding-bottom: 80px; /* Space for bottom nav */
  }
}

/* Extra small */
@media (max-width: 480px) {
  .menu-label { font-size: 10px; }
  .menu-item { padding: 6px 8px; }
}
```

---

## 📊 Component Adaptations

### Header
- **Desktop**: 24px title, 14px subtitle
- **Mobile**: 20px title, 13px subtitle (480px: 18px)
- **Logout button**: Smaller on mobile (8px padding)

### Table
- **Desktop**: Full width, all columns visible
- **Mobile**: 
  - Horizontal scroll enabled
  - Minimum width 800px to prevent compression
  - Smaller fonts (13px → 12px on 480px)
  - Nowrap on cells to prevent breaking

### Action Buttons
- **Desktop**: Inline buttons
- **Mobile**: Stacked vertically with 4px gap
- **Size**: Smaller padding (8px 12px) and font (12px)

### Driver Info
- **Mobile**: Reduced font size (12px)
- **Address**: Wrapped properly in narrow columns

---

## 🎯 User Experience on Mobile

### Bottom Navigation

**Menu Items**:
1. **👤 Duyệt tài xế** 
   - Path: `/admin/drivers?status=PENDING_VERIFICATION`
   - Badge: Shows pending count
   
2. **🚗 Quản lý tài xế**
   - Path: `/admin/drivers`
   
3. **💰 Cấu hình giá cước**
   - Path: `/admin/pricing`

**Active State**:
- Background: `rgba(0, 155, 119, 0.1)` (light green)
- Bottom border: `3px solid #00b386` (green)
- Text color: `#00b386` (green)

### Touch Targets
All interactive elements meet **minimum 44x44px** touch target size:
- Menu items: ✅ Adequate padding
- Action buttons: ✅ Full width on mobile
- Table cells: ✅ Increased padding

### Scrolling
- **Content**: Natural vertical scroll
- **Table**: Horizontal scroll when content exceeds width
- **Bottom Nav**: Fixed, always visible

---

## 🧪 Testing Responsive Design

### Browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test breakpoints:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1024px+)

### Key Things to Test
- ✅ Bottom nav appears at < 768px
- ✅ Logo hidden on mobile
- ✅ Menu items horizontal
- ✅ Active state works
- ✅ Badge position correct
- ✅ Table scrolls horizontally
- ✅ Content has bottom padding (80px)
- ✅ Touch targets adequate size

---

## 🎨 Visual Examples

### Desktop Layout
```
┌──────────┬────────────────────────────────┐
│          │  Header                        │
│  Sidebar ├────────────────────────────────┤
│          │                                │
│  Logo    │                                │
│          │        Content Area            │
│  ✓ Menu1 │                                │
│    Menu2 │                                │
│    Menu3 │                                │
│          │                                │
└──────────┴────────────────────────────────┘
```

### Mobile Layout
```
┌────────────────────────────────────┐
│  Header                            │
├────────────────────────────────────┤
│                                    │
│                                    │
│        Content Area                │
│                                    │
│                                    │
├────────────────────────────────────┤
│  [Icon1] [Icon2] [Icon3]          │
│  Menu1   Menu2   Menu3   <- Bottom│
└────────────────────────────────────┘
```

---

## 💡 Best Practices

### Mobile UX
1. **Always visible navigation**: Bottom bar is fixed
2. **Clear active state**: Visual feedback with color
3. **Touch-friendly**: Large, well-spaced targets
4. **Scrollable content**: Natural scrolling behavior
5. **Table accessibility**: Horizontal scroll for wide tables

### Performance
- CSS transitions are smooth (0.3s ease)
- No JavaScript required for responsive layout
- Pure CSS media queries for best performance

### Accessibility
- Semantic HTML maintained
- Touch targets meet WCAG guidelines (44px minimum)
- Labels always visible (not icon-only)
- Color contrast maintained

---

## 🚀 Quick Reference

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Sidebar** | Left (260px) | Bottom (auto height) |
| **Logo** | Visible | Hidden |
| **Menu Layout** | Vertical | Horizontal |
| **Active Indicator** | Left border (3px) | Bottom border (3px) |
| **Content Margin** | margin-left: 260px | margin-left: 0 |
| **Content Padding** | normal | padding-bottom: 80px |
| **Table** | Full width | Horizontal scroll |
| **Font Sizes** | Standard | Reduced |
| **Touch Targets** | Mouse-friendly | Touch-optimized |

---

## 🔍 Troubleshooting

### Bottom nav not showing on mobile
- Check screen width < 768px
- Verify CSS media query is loaded
- Clear browser cache

### Content hidden behind bottom nav
- Ensure `.admin-main` has `padding-bottom: 80px`
- Check if content is inside `.admin-content`

### Table columns overlapping
- Table should have `min-width: 800px`
- Container should have `overflow-x: auto`
- Cells should have `white-space: nowrap`

### Active state not working
- Check URL matches menu item path
- Verify `isActive()` function logic
- Check CSS for `.menu-item.active`

---

**✨ Result**: Beautiful, functional admin panel that works seamlessly on all devices!
