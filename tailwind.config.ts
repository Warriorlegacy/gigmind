import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6C47FF',
          dark: '#5234D4',
          light: '#8B6FFF',
          50: '#F0EDFF',
          100: '#DDD6FF',
          200: '#BAB0FF',
          300: '#9B8AFF',
          400: '#7D63FF',
          500: '#6C47FF',
          600: '#5A2DE6',
          700: '#4A20C0',
          800: '#3A1896',
          900: '#2A0F6C',
        },
        surface: {
          DEFAULT: '#0F0F13',
          card: '#1A1A24',
          elevated: '#222233',
          border: '#2A2A3A',
          hover: '#2E2E42',
        },
        success: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#4ADE80',
          bg: 'rgba(34,197,94,0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FBBF24',
          bg: 'rgba(245,158,11,0.1)',
        },
        error: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
          bg: 'rgba(239,68,68,0.1)',
        },
        info: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
          bg: 'rgba(59,130,246,0.1)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #6C47FF 0%, #9B8AFF 100%)',
        'surface-gradient': 'linear-gradient(180deg, #1A1A24 0%, #0F0F13 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-dot': 'pulse-dot 1.4s infinite ease-in-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
