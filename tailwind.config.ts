import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
          700: '#c2570a',
          800: '#9a4007',
          900: '#7c3107',
        },
        // 🔴 SAVE PICK 디자인 시스템 (Claude Design 최종본 기준)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        good: 'var(--good)',
        'good-soft': 'var(--good-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        kakao: '#FEE500',
        'kakao-ink': '#191919',
      },
      fontFamily: {
        pretendard: ['Pretendard', '-apple-system', 'sans-serif'],
        unbounded: ['Unbounded', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config
