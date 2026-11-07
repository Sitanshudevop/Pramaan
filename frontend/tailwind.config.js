/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-dark': 'var(--surface-dark)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'orange-300': 'var(--orange-300)',
        'orange-500': 'var(--orange-500)',
        'orange-600': 'var(--orange-600)',
        'orange-text': 'var(--orange-text)',
        'on-orange': 'var(--on-orange)',
        lime: 'var(--lime)',
        'on-lime': 'var(--on-lime)',
        'success-text': 'var(--success-text)',
        danger: 'var(--danger)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        inner: '12px',
        pill: '9999px',
        btn: '9999px',
        input: '9999px',
      },
      boxShadow: {
        floating: 'var(--shadow-floating)',
      },
      maxWidth: {
        reading: '880px',
        app: '1280px',
      },
    },
  },
  plugins: [],
}
