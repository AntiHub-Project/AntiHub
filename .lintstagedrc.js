export default {
  "*.{js,ts,mjs,cjs,json,tsx,css,less,scss,vue,html}": ["cspell lint --no-must-find-files --cache"],
  "*.{js,ts,jsx,tsx,vue}": ["prettier --write", "eslint --fix"],
  "*.{css,less,scss}": ["prettier --write"],
};
