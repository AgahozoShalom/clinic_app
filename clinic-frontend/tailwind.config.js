/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:        { DEFAULT: '#4A8060', dark: '#2E5C40', light: '#EAF3EE' },
        accent:       { DEFAULT: '#E09C46', light: '#FDF3E3' },
        surface:      '#FFFFFF',
        bg:           '#F5F7F5',
        border:       '#D8E4DC',
        'text-primary': '#4B3F2B',
        'text-muted':   '#6D8662',
        success:      { DEFAULT: '#2E6648', bg: '#EAF3EE' },
        warning:      { DEFAULT: '#A0640A', bg: '#FDF3E3' },
        danger:       { DEFAULT: '#A03030', bg: '#FAEAEA' },
        info:         { DEFAULT: '#47795D', bg: '#EAF3EE' },
      }
    },
  },
  plugins: [],
}
