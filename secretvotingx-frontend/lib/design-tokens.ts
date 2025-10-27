/**
 * Design Tokens for SecretVotingX
 * Generated based on: sha256("SecretVotingX_Sepolia_202510_SecretVoting")
 * 
 * Seed calculation (deterministic):
 * - Project: SecretVotingX
 * - Network: Sepolia
 * - Month: 202510
 * - Contract: SecretVoting
 * 
 * Design decisions (based on seed):
 * - Design System: Glassmorphism (毛玻璃效果)
 * - Color Palette: Deep Ocean Blue (#0A4D8C, #40E0D0)
 * - Typography: Inter Sans-serif, Scale 1.2
 * - Layout: Top Tabs + Content Area
 * - Border Radius: Medium (8px/12px/16px)
 * - Transitions: Standard (150ms/250ms/350ms)
 */

// Simplified seed calculation (using string hash for determinism)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const seed = simpleHash("SecretVotingX_Sepolia_202510_SecretVoting");

// Design selections based on seed modulo
const designSystem = ["Material", "Fluent", "Neumorphism", "Glassmorphism", "Minimal"][seed % 5];
// Deterministic selections (stored for reference):
// colorPaletteIndex = seed % 8 (0 = Deep Ocean Blue)
// typographyIndex = seed % 3 (1 = Sans)
// layoutIndex = seed % 5 (2 = Top Tabs)
// borderRadiusIndex = seed % 4 (1 = Medium)
// transitionIndex = seed % 3 (1 = Standard)

export const designTokens = {
  seed: seed.toString(),
  system: designSystem, // "Glassmorphism"
  
  // Colors - Deep Ocean Blue Palette
  colors: {
    light: {
      primary: "#0A4D8C",
      primaryHover: "#0E6BA8",
      primaryActive: "#094177",
      accent: "#40E0D0",
      accentHover: "#00CED1",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      surfaceElevated: "#FFFFFF",
      border: "#E2E8F0",
      text: "#1E293B",
      textSecondary: "#64748B",
      textTertiary: "#94A3B8",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    dark: {
      primary: "#0E6BA8",
      primaryHover: "#1E88E5",
      primaryActive: "#094177",
      accent: "#00CED1",
      accentHover: "#40E0D0",
      background: "#0B1221",
      surface: "#131B2E",
      surfaceElevated: "#1A2642",
      border: "#2D3A52",
      text: "#F1F5F9",
      textSecondary: "#94A3B8",
      textTertiary: "#64748B",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F87171",
      info: "#60A5FA",
    },
  },

  // Typography - Inter Sans-serif
  typography: {
    fontFamily: {
      sans: "'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    scale: 1.2,
    sizes: {
      xs: "0.75rem",      // 12px
      sm: "0.875rem",     // 14px
      base: "1rem",       // 16px
      lg: "1.2rem",       // 19.2px
      xl: "1.44rem",      // 23px
      "2xl": "1.728rem",  // 27.6px
      "3xl": "2.074rem",  // 33.2px
      "4xl": "2.488rem",  // 39.8px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing
  spacing: {
    xs: "0.25rem",   // 4px
    sm: "0.5rem",    // 8px
    md: "1rem",      // 16px
    lg: "1.5rem",    // 24px
    xl: "2rem",      // 32px
    "2xl": "3rem",   // 48px
    "3xl": "4rem",   // 64px
    "4xl": "6rem",   // 96px
  },

  // Border Radius - Medium
  borderRadius: {
    none: "0",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    full: "9999px",
  },

  // Shadows - Glassmorphism style
  shadows: {
    none: "none",
    sm: "0 1px 2px rgba(10, 77, 140, 0.05)",
    md: "0 4px 6px rgba(10, 77, 140, 0.1)",
    lg: "0 10px 15px rgba(10, 77, 140, 0.1), 0 4px 6px rgba(10, 77, 140, 0.05)",
    xl: "0 20px 25px rgba(10, 77, 140, 0.15), 0 10px 10px rgba(10, 77, 140, 0.04)",
    "2xl": "0 25px 50px rgba(10, 77, 140, 0.25)",
    glass: "0 8px 32px 0 rgba(10, 77, 140, 0.1)",
  },

  // Transitions - Standard
  transitions: {
    fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Glassmorphism specific
  glassmorphism: {
    backdrop: "blur(16px) saturate(180%)",
    background: "rgba(255, 255, 255, 0.75)",
    backgroundDark: "rgba(19, 27, 46, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  },

  // Layout - Top Tabs style
  layout: {
    maxWidth: "1280px",
    containerPadding: "1.5rem",
    headerHeight: "64px",
    sidebarWidth: "280px",
  },

  // Density modes
  density: {
    compact: {
      multiplier: 0.75,
      padding: "0.375rem 0.75rem",
    },
    comfortable: {
      multiplier: 1.0,
      padding: "0.5rem 1rem",
    },
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
} as const;

export type DesignTokens = typeof designTokens;

