/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#18191e',
          raised: '#1f2027',
          overlay: '#282930',
        },
        ink: {
          DEFAULT: '#edeff5',
          muted: '#9da0ad',
          faint: '#636674',
        },
        accent: {
          DEFAULT: '#7eb3e8',
          hover: '#94c4f0',
          muted: '#4a7ab0',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
