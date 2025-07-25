// UI Theme Configuration
// Centralized colors, icons, and styling variables for the AI Quiz Assistant Extension

const THEME_CONFIG = {
  // Color Palette
  colors: {
    // Primary Colors
    primary: '#007cba',
    primaryHover: '#0056b3',
    primaryLight: 'rgba(0, 123, 186, 0.05)',
    primaryBorder: 'rgba(0, 123, 186, 0.1)',
    
    // Secondary Colors
    secondary: '#6c757d',
    
    // Status Colors
    success: '#28a745',
    successLight: '#d4edda',
    successBackground: 'rgba(40, 167, 69, 0.05)',
    successBorder: 'rgba(0, 255, 0, 0.3)',
    successText: '#155724',
    
    info: '#17a2b8',
    infoLight: '#d1ecf1',
    infoBackground: 'rgba(23, 162, 184, 0.1)',
    infoBorder: 'rgba(23, 162, 184, 0.3)',
    
    warning: '#ffc107',
    warningLight: '#fff3cd',
    warningBackground: 'rgba(255, 193, 7, 0.1)',
    warningBorder: 'rgba(255, 193, 7, 0.3)',
    warningText: '#856404',
    
    danger: '#dc3545',
    dangerLight: '#f8d7da',
    dangerBackground: 'rgba(220, 53, 69, 0.1)',
    dangerBorder: 'rgba(220, 53, 69, 0.3)',
    dangerText: '#721c24',
    
    // Neutral Colors
    white: '#ffffff',
    light: '#f8f9fa',
    lightGray: '#f0f0f0',
    mediumGray: '#ccc',
    darkGray: '#666',
    dark: '#333',
    black: '#000000',
    
    // Background Colors
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    popupBackground: '#ffffff',
    overlayBackground: 'rgba(255, 255, 255, 0.1)',
    modalBackground: 'rgba(0, 0, 0, 0.5)',
    
    // Border Colors
    border: '#007cba',
    borderLight: 'rgba(255, 255, 255, 0.3)',
    borderDark: 'rgba(255, 255, 255, 0.2)',
    
    // Confidence Level Colors
    confidence: {
      high: {
        background: '#d4edda',
        text: 'green',
        highlight: 'rgba(0, 255, 0, 0.3)',
        border: '#28a745'
      },
      medium: {
        background: '#fff3cd',
        text: 'orange',
        highlight: 'rgba(255, 165, 0, 0.3)',
        border: '#ffc107'
      },
      low: {
        background: '#f8d7da',
        text: 'red',
        highlight: 'rgba(255, 0, 0, 0.3)',
        border: '#dc3545'
      },
      unknown: {
        background: '#f8f9fa',
        text: 'gray',
        highlight: 'rgba(128, 128, 128, 0.3)',
        border: '#6c757d'
      }
    },
    
    // Multi-model specific colors
    multiModel: {
      consensus: {
        background: 'rgba(0, 255, 0, 0.1)',
        border: '#28a745',
        text: '#28a745'
      },
      disagreement: {
        background: 'rgba(255, 193, 7, 0.1)',
        border: '#ffc107',
        text: '#ffc107'
      },
      partial: {
        background: 'rgba(23, 162, 184, 0.1)',
        border: '#17a2b8',
        text: '#17a2b8'
      },
      error: {
        background: 'rgba(220, 53, 69, 0.1)',
        border: '#dc3545',
        text: '#dc3545'
      }
    }
  },
  
  // Icons and Emojis
  icons: {
    // Main Icons
    robot: '🤖',
    brain: '🧠',
    lightning: '⚡',
    rocket: '🚀',
    target: '🎯',
    
    // Action Icons
    search: '🔍',
    link: '🔗',
    trash: '🗑️',
    refresh: '🔄',
    close: '✕',
    pin: '📌',
    
    // Status Icons
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳',
    
    // UI Icons
    arrowUp: '🔼',
    arrowDown: '🔽',
    bulb: '💡',
    chart: '📊',
    cog: '⚙️',
    
    // Model Icons
    singleModel: '⚡',
    multiModel: '🧠',
    science: '🔬',
    
    // Confidence Icons
    highConfidence: '🟢',
    mediumConfidence: '🟡',
    lowConfidence: '🔴',
    
    // Multi-model status icons
    consensus: '✅',
    disagreement: '⚠️',
    partial: '🔄',
    modelError: '❌'
  },
  
  // Button Styles
  buttons: {
    primary: {
      background: '#28a745',
      color: '#ffffff',
      hoverBackground: '#218838'
    },
    secondary: {
      background: '#007bff',
      color: '#ffffff',
      hoverBackground: '#0056b3'
    },
    info: {
      background: '#17a2b8',
      color: '#ffffff',
      hoverBackground: '#138496'
    },
    warning: {
      background: '#ffc107',
      color: '#212529',
      hoverBackground: '#e0a800'
    },
    danger: {
      background: '#dc3545',
      color: '#ffffff',
      hoverBackground: '#c82333'
    },
    
    // Common button properties
    common: {
      border: 'none',
      borderRadius: '6px',
      padding: '10px 12px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      hoverTransform: 'translateY(-1px)',
      hoverBoxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }
  },
  
  // Typography
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: {
      small: '10px',
      normal: '13px',
      medium: '16px',
      large: '18px'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '600'
    }
  },
  
  // Spacing
  spacing: {
    xs: '3px',
    sm: '6px',
    md: '10px',
    lg: '15px',
    xl: '20px'
  },
  
  // Border Radius
  borderRadius: {
    small: '3px',
    medium: '5px',
    large: '8px',
    xl: '10px'
  },
  
  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.2)',
    medium: '0 4px 8px rgba(0,0,0,0.3)',
    large: '0 8px 16px rgba(0,0,0,0.4)'
  },
  
  // Z-index values
  zIndex: {
    popup: 10000,
    modal: 10001,
    notification: 10002
  }
};

// Helper functions to get theme values
const ThemeHelper = {
  // Get color by path (e.g., 'colors.success' or 'colors.confidence.high.background')
  getColor: (path) => {
    return path.split('.').reduce((obj, key) => obj && obj[key], THEME_CONFIG);
  },
  
  // Get icon by name
  getIcon: (name) => {
    return THEME_CONFIG.icons[name] || '';
  },
  
  // Get button style by type
  getButtonStyle: (type) => {
    const buttonType = THEME_CONFIG.buttons[type] || THEME_CONFIG.buttons.primary;
    const common = THEME_CONFIG.buttons.common;
    
    return {
      background: buttonType.background,
      color: buttonType.color,
      border: common.border,
      borderRadius: common.borderRadius,
      padding: common.padding,
      fontSize: common.fontSize,
      fontWeight: common.fontWeight,
      cursor: common.cursor,
      transition: common.transition,
      boxShadow: common.boxShadow
    };
  },
  
  // Get confidence colors based on confidence level
  getConfidenceColors: (confidence) => {
    if (typeof confidence === 'number') {
      if (confidence >= 8) return THEME_CONFIG.colors.confidence.high;
      if (confidence >= 5) return THEME_CONFIG.colors.confidence.medium;
      return THEME_CONFIG.colors.confidence.low;
    } else if (typeof confidence === 'string') {
      const normalizedConf = confidence.toLowerCase();
      if (normalizedConf === 'high') return THEME_CONFIG.colors.confidence.high;
      if (normalizedConf === 'medium') return THEME_CONFIG.colors.confidence.medium;
      if (normalizedConf === 'low') return THEME_CONFIG.colors.confidence.low;
    }
    return THEME_CONFIG.colors.confidence.unknown;
  },
  
  // Get multi-model colors based on status
  getMultiModelColors: (status) => {
    return THEME_CONFIG.colors.multiModel[status] || THEME_CONFIG.colors.multiModel.error;
  },
  
  // Generate CSS style string from style object
  generateCSSText: (styleObj) => {
    return Object.entries(styleObj)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { THEME_CONFIG, ThemeHelper };
} else if (typeof window !== 'undefined') {
  window.THEME_CONFIG = THEME_CONFIG;
  window.ThemeHelper = ThemeHelper;
}
