module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'wc-primary': '#102d4e',
        'wc-accent': '#00d4ff',
        'wc-gold': '#ffb700',
        'wc-mexico': '#006341',
        'wc-canada': '#ef3340',
        'wc-usa': '#002868',
      },
      backgroundImage: {
        'wc-pattern': "url('https://www.transparenttextures.com/patterns/cubes.png')",
        'wc-gradient': "linear-gradient(135deg, #102d4e 0%, #1a4a7a 100%)",
      }
    },
  },
  plugins: [],
}
