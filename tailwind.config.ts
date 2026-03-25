import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#0d0d14',
          card: '#13131a',
          panel: '#1a1a24',
        },
        gold: {
          DEFAULT: '#c9a84c',
          dark: '#b8963e',
          light: '#d4b85a',
        },
        cinnabar: {
          DEFAULT: '#8b1a1a',
          light: '#a02020',
        },
        text: {
          primary: '#e8e0d0',
          secondary: '#9a8a6a',
        },
        border: {
          gold: 'rgba(201,168,76,0.2)',
        },
        team: {
          1: '#e05555',
          2: '#e09055',
          3: '#e0c055',
          4: '#5580e0',
          5: '#55b0e0',
          6: '#9055e0',
        },
      },
      fontFamily: {
        title: ['LXGW WenKai', 'Noto Serif SC', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        display: ['Cinzel', 'Cormorant Garamond', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
