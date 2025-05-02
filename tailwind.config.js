module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}"
  ],
  theme: {
    extend: {
      colors: {
        'wow-bg': '#0f0f0f',
        'wow-text': '#FFD700',
        'warrior': '#C79C6E',
        'paladin': '#F58CBA',
        'hunter': '#ABD473',
        'rogue': '#FFF569',
        'priest': '#FFFFFF',
        'deathknight': '#C41F3B',
        'shaman': '#0070DE',
        'mage': '#69CCF0',
        'warlock': '#9482C9',
        'monk': '#00FF96',
        'druid': '#FF7D0A',
        'demonhunter': '#A330C9',
        'evoker': '#33937F',
      },
      fontFamily: {
        wow: ['"Cinzel Decorative"', 'serif'],
      }
    },
  },
  plugins: [],
}
