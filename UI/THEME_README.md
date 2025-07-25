# UI Theme Configuration System

## Overview

The AI Quiz Assistant extension now uses a centralized theme configuration system that allows you to easily customize colors, icons, and styling across the entire UI from a single file.

## Files Structure

```
UI/
├── theme-config.js     # Main theme configuration file
├── popup.html          # Updated to use theme config
├── popup.js           # Updated to use theme config  
├── content.js         # Updated to use theme config
├── log.html          # Updated to use theme config
├── manifest.json     # Updated to include theme-config.js
└── README.md         # This documentation
```

## Theme Configuration File (`theme-config.js`)

The `theme-config.js` file contains all customizable UI elements organized into logical sections:

### Color Palette
- **Primary Colors**: Main brand colors used throughout the UI
- **Status Colors**: Success, info, warning, danger colors
- **Neutral Colors**: White, gray, dark colors for backgrounds and text
- **Confidence Colors**: Specific colors for different confidence levels
- **Multi-model Colors**: Colors for consensus, disagreement, partial, and error states

### Icons and Emojis
- **Main Icons**: Robot, brain, lightning, rocket, target
- **Action Icons**: Search, link, trash, refresh, close, pin
- **Status Icons**: Success, warning, error, loading
- **UI Icons**: Arrows, bulb, chart, cog
- **Model Icons**: Single model, multi-model, science
- **Confidence Icons**: High, medium, low confidence indicators

### Button Styles
- **Primary, Secondary, Info, Warning, Danger**: Pre-defined button styles
- **Common Properties**: Shared styling like padding, border-radius, transitions

### Typography
- **Font Family**: Default font stack
- **Font Sizes**: Small, normal, medium, large
- **Font Weights**: Normal, medium, bold

### Spacing and Layout
- **Spacing**: Consistent spacing values (xs, sm, md, lg, xl)
- **Border Radius**: Small, medium, large, xl radius values
- **Shadows**: Small, medium, large shadow effects
- **Z-index**: Layering values for popups, modals, notifications

## How to Customize

### 1. Changing Colors

To change colors throughout the extension, edit the `THEME_CONFIG.colors` object in `theme-config.js`:

```javascript
// Example: Change primary color from blue to purple
colors: {
  primary: '#7B68EE',           // Changed from '#007cba'
  primaryHover: '#6A5ACD',      // Changed from '#0056b3'
  // ... other colors
}
```

### 2. Changing Icons

To change icons, edit the `THEME_CONFIG.icons` object:

```javascript
// Example: Change robot icon
icons: {
  robot: '🚀',                  // Changed from '🤖'
  // ... other icons
}
```

### 3. Changing Button Styles

To modify button appearances:

```javascript
// Example: Change primary button color
buttons: {
  primary: {
    background: '#FF6B6B',      // Changed from '#28a745'
    color: '#ffffff',
    hoverBackground: '#FF5252'  // Changed from '#218838'
  }
}
```

### 4. Changing Spacing and Layout

To adjust spacing throughout the UI:

```javascript
// Example: Increase spacing
spacing: {
  xs: '4px',                    // Changed from '3px'
  sm: '8px',                    // Changed from '6px'
  md: '12px',                   // Changed from '10px'
  lg: '18px',                   // Changed from '15px'
  xl: '24px'                    // Changed from '20px'
}
```

## Helper Functions

The `ThemeHelper` object provides utility functions:

### `getColor(path)`
Get a color by dot notation path:
```javascript
const primaryColor = ThemeHelper.getColor('colors.primary');
const successBg = ThemeHelper.getColor('colors.confidence.high.background');
```

### `getIcon(name)`
Get an icon by name:
```javascript
const robotIcon = ThemeHelper.getIcon('robot');
const successIcon = ThemeHelper.getIcon('success');
```

### `getButtonStyle(type)`
Get complete button styling:
```javascript
const primaryStyle = ThemeHelper.getButtonStyle('primary');
const warningStyle = ThemeHelper.getButtonStyle('warning');
```

### `getConfidenceColors(confidence)`
Get colors based on confidence level:
```javascript
const colors = ThemeHelper.getConfidenceColors(8); // High confidence
const colors = ThemeHelper.getConfidenceColors('Medium'); // Medium confidence
```

### `getMultiModelColors(status)`
Get colors for multi-model analysis results:
```javascript
const consensusColors = ThemeHelper.getMultiModelColors('consensus');
const errorColors = ThemeHelper.getMultiModelColors('error');
```

### `generateCSSText(styleObj)`
Convert style object to CSS text:
```javascript
const cssText = ThemeHelper.generateCSSText({
  backgroundColor: '#007cba',
  color: 'white',
  padding: '10px'
});
// Returns: "background-color: #007cba; color: white; padding: 10px"
```

## File Integration

### popup.html
- Loads `theme-config.js` before other scripts
- Uses empty `<style id="theme-styles">` tag for dynamic CSS injection
- Icon placeholders are populated by JavaScript

### popup.js
- `initializeTheme()` function injects CSS using theme configuration
- Uses `ThemeHelper.getIcon()` to set icons dynamically
- Button creation uses theme-based styling

### content.js
- Functions check for `window.ThemeHelper` availability
- Falls back to hardcoded values if theme is not loaded
- UI creation functions use theme configuration for styling

### log.html
- Uses theme configuration for table and button styling
- Dynamic CSS injection on DOM load

### manifest.json
- Updated to load `theme-config.js` before `content.js` in content scripts

## Benefits

1. **Centralized Control**: Change colors and icons throughout the entire extension from one file
2. **Consistency**: Ensures consistent styling across all UI components
3. **Easy Customization**: Simple object-based configuration
4. **Fallback Support**: Graceful degradation if theme is not loaded
5. **Type Safety**: Helper functions provide safe access to theme values
6. **Future-Proof**: Easy to extend with new theme properties

## Quick Color Schemes

Here are some pre-defined color schemes you can copy into your theme config:

### Dark Theme
```javascript
colors: {
  primary: '#BB86FC',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  popupBackground: '#2d2d2d',
  // ... customize other colors
}
```

### Green Theme
```javascript
colors: {
  primary: '#4CAF50',
  background: 'linear-gradient(135deg, #388E3C 0%, #2E7D32 100%)',
  // ... customize other colors
}
```

### Orange Theme
```javascript
colors: {
  primary: '#FF9800',
  background: 'linear-gradient(135deg, #F57C00 0%, #E65100 100%)',
  // ... customize other colors
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "runQuizAssistant function not found"
**Cause**: Content script not loaded or not available on current page
**Solutions**: 
- **Check Current Page**: Ensure you're on a supported quiz page (`quiz.mygov.in` or similar)
- **Use Test Button**: Click "Test Connection" in popup to verify content script loading
- **Manual Script Injection**: The popup now automatically injects scripts if needed
- **Check Browser Console**: Look for content script loading messages
- **Reload Extension**: Disable and re-enable the extension in Chrome

**Debugging Steps**:
1. Open browser console (F12)
2. Click "Test Connection" button in popup
3. Check console output for script loading status
4. If on unsupported page, navigate to a quiz page
5. Try "Process All" again

#### 2. "Identifier 'THEME_CONFIG' has already been declared"
**Cause**: The theme configuration is being loaded multiple times
**Solution**: 
- Ensure `theme-config.js` is only loaded once per context
- The theme file now includes protection against redeclaration
- Restart the extension after changes

#### 2. Theme not loading in popup
**Cause**: Script loading order or timing issues
**Solution**:
- The popup now includes fallback styling and retry logic
- Check browser console for specific error messages
- Ensure `theme-config.js` is loaded before `popup.js` in popup.html

#### 3. Icons not showing
**Cause**: Icon names in `ThemeHelper.getIcon()` calls don't match config
**Solution**:
- Verify icon names in the THEME_CONFIG.icons object
- Check browser console for "undefined" icon warnings
- Use the theme-test.html file to verify theme loading

#### 4. Colors not applying in content script
**Cause**: Theme configuration may not be loading in the content script context
**Solution**:
- Verify `manifest.json` includes `theme-config.js` before `content.js`
- Check that functions use fallback colors when theme is unavailable
- Refresh the target page after making changes

#### 5. Extension fails to load
**Cause**: Syntax errors in theme configuration
**Solution**:
- Use the provided `theme-test.html` to test configuration
- Check browser console for JavaScript errors
- Validate JSON-like structures in the theme config

### Testing the Theme System

1. **Open theme-test.html**: Load `d:\Web\Chrome\UI\theme-test.html` in your browser to verify theme configuration
2. **Check Browser Console**: Look for any JavaScript errors or warnings
3. **Test Extension**: Load the extension and check popup functionality
4. **Test Content Script**: Visit a quiz page and verify content script theming

## Future Enhancements

The theme system is designed to be easily extensible. Future additions could include:
- Animation timing configurations
- Multiple theme presets
- User-selectable themes
- Import/export theme configurations
- Theme validation and error checking
