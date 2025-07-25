// Theme Configuration Validator
// Run this in browser console to check theme configuration

function validateThemeConfig() {
  console.log('🔍 Validating Theme Configuration...\n');
  
  const errors = [];
  const warnings = [];
  
  // Check if THEME_CONFIG exists
  if (typeof THEME_CONFIG === 'undefined') {
    errors.push('THEME_CONFIG is not defined');
    return { errors, warnings };
  }
  
  console.log('✅ THEME_CONFIG is defined');
  
  // Check main sections
  const requiredSections = ['colors', 'icons', 'buttons', 'typography', 'spacing', 'borderRadius', 'shadows', 'zIndex'];
  requiredSections.forEach(section => {
    if (!THEME_CONFIG[section]) {
      errors.push(`Missing section: ${section}`);
    } else {
      console.log(`✅ Section '${section}' exists`);
    }
  });
  
  // Check ThemeHelper
  if (typeof ThemeHelper === 'undefined') {
    errors.push('ThemeHelper is not defined');
  } else {
    console.log('✅ ThemeHelper is defined');
    
    // Test helper functions
    try {
      const testColor = ThemeHelper.getColor('colors.primary');
      if (!testColor) warnings.push('Primary color not found');
      else console.log(`✅ Primary color: ${testColor}`);
      
      const testIcon = ThemeHelper.getIcon('robot');
      if (!testIcon) warnings.push('Robot icon not found');
      else console.log(`✅ Robot icon: ${testIcon}`);
      
      const testButtonStyle = ThemeHelper.getButtonStyle('primary');
      if (!testButtonStyle || !testButtonStyle.background) {
        warnings.push('Primary button style incomplete');
      } else {
        console.log(`✅ Primary button style: ${testButtonStyle.background}`);
      }
      
    } catch (e) {
      errors.push(`ThemeHelper function error: ${e.message}`);
    }
  }
  
  // Check specific color categories
  if (THEME_CONFIG.colors) {
    const colorCategories = ['primary', 'success', 'warning', 'danger', 'info'];
    colorCategories.forEach(category => {
      if (!THEME_CONFIG.colors[category]) {
        warnings.push(`Missing color category: ${category}`);
      }
    });
    
    // Check confidence colors
    if (!THEME_CONFIG.colors.confidence) {
      errors.push('Missing confidence colors section');
    } else {
      const confidenceLevels = ['high', 'medium', 'low', 'unknown'];
      confidenceLevels.forEach(level => {
        if (!THEME_CONFIG.colors.confidence[level]) {
          warnings.push(`Missing confidence level: ${level}`);
        }
      });
    }
  }
  
  // Check icon completeness
  if (THEME_CONFIG.icons) {
    const essentialIcons = ['robot', 'brain', 'lightning', 'rocket', 'target', 'search', 'close'];
    essentialIcons.forEach(icon => {
      if (!THEME_CONFIG.icons[icon]) {
        warnings.push(`Missing essential icon: ${icon}`);
      }
    });
  }
  
  // Report results
  console.log('\n📊 Validation Results:');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n🎉 Theme configuration is valid!');
  }
  
  return { errors, warnings };
}

// Auto-run validation
validateThemeConfig();
