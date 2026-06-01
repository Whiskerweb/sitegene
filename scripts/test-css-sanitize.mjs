// node --import tsx scripts/test-css-sanitize.mjs
import { sanitizeCss } from "../lib/css-sanitize.ts";

let fails = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fails++;
    console.error("✗", msg);
  } else console.log("✓", msg);
};

ok(sanitizeCss("#top { background: #1a1208 }").ok, "CSS simple accepté");
ok(sanitizeCss('[data-sg-path="hero.title[0]"]{color:#f97316}').ok, "sélecteur attribut accepté");
ok(sanitizeCss("body{background:url('data:image/png;base64,AAAA')}").ok, "data:image accepté");

ok(!sanitizeCss("</style><script>alert(1)</script>").ok, "breakout </style> refusé");
ok(!sanitizeCss("@import url(http://evil.com)").ok, "@import refusé");
ok(!sanitizeCss("a{background:url(javascript:alert(1))}").ok, "javascript: refusé");
ok(!sanitizeCss("a{behavior:url(x.htc)}").ok, "behavior: refusé");
ok(!sanitizeCss("a{background:url(data:text/html,<b>)}").ok, "data:text/html refusé");
ok(!sanitizeCss("").ok, "vide refusé");
ok(!sanitizeCss(123).ok, "non-string refusé");

console.log(fails === 0 ? "\nTOUS OK" : `\n${fails} ÉCHEC(S)`);
process.exit(fails === 0 ? 0 : 1);
