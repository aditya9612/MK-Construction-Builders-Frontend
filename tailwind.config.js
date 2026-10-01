/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#2E6FA8',
          hover: '#255A8A',
          secondary: '#4F8DBE',
          light: '#EAF3FA',
          pale: '#F4F8FC',
          navy: '#0B223D',
          deep: '#102F4F',
        },
        navy: {
          50: '#F4F8FC',
          100: '#EAF3FA',
          200: '#D5E6F2',
          300: '#A8C6DE',
          400: '#4F8DBE',
          500: '#2E6FA8',
          600: '#255A8A',
          700: '#102F4F',
          800: '#0B223D',
          900: '#0B223D',
          950: '#071525',
        },
        ink: '#0F172A',
        muted: '#5F7185',
        faint: '#8A99A8',
        line: '#DCE5ED',
        success: '#168B5B',
        warning: '#C78316',
        danger: '#C94242',
        surface: {
          DEFAULT: '#F6F8FB',
          card: '#FFFFFF',
        },
      },
      boxShadow: {
        card: '0 2px 10px rgba(11, 34, 61, 0.035)',
        header: '0 1px 0 rgba(11, 34, 61, 0.06)',
        pop: '0 10px 28px rgba(11, 34, 61, 0.08)',
        paper: '0 12px 40px rgba(11, 34, 61, 0.08)',
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '12px',
      },
      fontSize: {
        page: ['30px', { lineHeight: '36px', letterSpacing: '-0.03em', fontWeight: '600' }],
        section: ['18px', { lineHeight: '26px', letterSpacing: '-0.02em', fontWeight: '600' }],
        card: ['15px', { lineHeight: '22px', fontWeight: '600' }],
      },
      maxWidth: {
        a4: '210mm',
        app: '1440px',
      },
      transitionDuration: {
        ui: '180ms',
      },
    },
  },
  plugins: [],
};
