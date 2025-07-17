/**
 * Basketball Analyzer Design System
 * 
 * Design Philosophy:
 * If Apple designed a basketball AI app — ultra-minimal, intuitive, and premium.
 * Blends clinical clarity with the rhythm of the game.
 * Focused, elegant, and quietly powerful.
 */

import { Platform } from 'react-native';

export const designSystem = {
  // COLOR STRATEGY
  colors: {
    // Foundation
    background: {
      primary: '#FFFFFF',
      secondary: '#F7F7F7',
      tertiary: '#F1F1F1',
      dark: '#0A0A0A',
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F5F5F7',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#111111',
      secondary: '#636366',
      tertiary: '#8E8E93',
      inverse: '#FFFFFF',
    },
    // Accent - used sparingly
    accent: {
      primary: '#FF5A1F', // refined orange
      light: '#FFF1EC',   // very subtle orange tint
    },
    // Feedback system - muted but clear
    feedback: {
      success: '#34C759',  // Apple green, slightly muted
      error: '#FF3B30',    // Apple red, slightly muted
      warning: '#FF9500',  // Apple orange/yellow, slightly muted
      neutral: '#8E8E93',  // neutral gray
    },
    // Dividers and separators
    divider: 'rgba(60, 60, 67, 0.1)', // light mode divider
    dividerDark: 'rgba(84, 84, 88, 0.65)', // dark mode divider
  },

  // TYPOGRAPHY
  typography: {
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'SF-Pro-Text', // We'll need to include this font for Android
      default: 'System',
    }),
    weights: {
      regular: Platform.OS === 'ios' ? '400' : 'normal',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // SPACING & LAYOUT
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },

  // VISUAL LANGUAGE
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // SHAPES & BORDERS
  shape: {
    borderRadius: {
      xs: 4,
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
      '2xl': 24,
      full: 9999,
    },
    border: {
      width: {
        thin: 0.5,
        regular: 1,
        thick: 2,
      },
    },
  },

  // COMPONENT SPECIFIC
  components: {
    // Video player specific styling
    videoPlayer: {
      controls: {
        background: 'rgba(0, 0, 0, 0.2)',
        activeBackground: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
      },
      timeline: {
        height: 4,
        activeHeight: 6,
        markerSize: 8,
        thumbSize: 18,
      }
    },
    // Cards and containers
    card: {
      background: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
    },
    // Buttons
    button: {
      primary: {
        backgroundColor: '#FF5A1F',
        pressedColor: '#E5400F',
      },
      secondary: {
        backgroundColor: '#F5F5F7',
        pressedColor: '#E5E5E7',
      }
    }
  }
};

// Helper function to add alpha to hex colors
export const withAlpha = (color: string, alpha: number): string => {
  const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${color}${hexAlpha}`;
};
