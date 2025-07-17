# Dark Mode Manual Test

## Test Steps

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the application in your browser**:
   - Navigate to `http://localhost:3000` (or the port shown in console)

3. **Test dark mode toggle**:
   - Look for the theme toggle button in the header (sun/moon icon)
   - Click the button to toggle between light and dark themes
   - Verify the following:
     - Background colors change appropriately
     - Text colors change appropriately  
     - Button styles update correctly
     - Icons switch between sun (for dark mode) and moon (for light mode)

4. **Test persistence**:
   - Toggle to dark mode
   - Refresh the page
   - Verify dark mode is still active
   - Toggle to light mode
   - Refresh the page
   - Verify light mode is still active

5. **Test system preference fallback**:
   - Open browser dev tools (F12)
   - In console, run: `localStorage.removeItem('theme')`
   - Refresh the page
   - Verify it respects your system dark/light mode preference

6. **Debug if not working**:
   - Open browser dev tools (F12)
   - In console, run: `document.documentElement.classList.contains('dark')`
   - This should return `true` for dark mode, `false` for light mode
   - Check if the `html` element has the `dark` class in Elements tab

## Expected Results

- ✅ Dark mode toggle button is visible and functional
- ✅ Clicking toggles between light and dark themes
- ✅ Theme preference is persisted in localStorage
- ✅ System preference is respected when no saved preference exists
- ✅ All UI elements (text, backgrounds, buttons) update correctly
- ✅ Icons change appropriately (sun for dark mode, moon for light mode)

## Technical Implementation

The dark mode implementation uses:
- **Tailwind CSS v4** with `@variant dark (.dark &);` directive
- **Class-based dark mode** using `html.dark` selector
- **localStorage persistence** for theme preference
- **System preference fallback** when no saved preference exists
- **Custom CSS variables** for consistent theming

## Debugging

If dark mode still doesn't work:
1. Check that `html` element gets the `dark` class when toggling
2. Verify Tailwind CSS classes like `dark:bg-gray-900` are being applied
3. Check browser console for any errors
4. Ensure development server was restarted after configuration changes