<script module lang="ts">
  /**
   * The original example's stylesheet, verbatim (detent.hayder.sh/examples, "Time zones"). The classes sit on elements in
   * the example and its sky components, and on rolling labels (`DetentText`), so it is injected as one global sheet.
   * The theme variables it uses (--fg, --bg, --muted, --line, --band, --accent) come from the site; `.tz` gets them here.
   */
  export const css = String.raw`
.tz{--tz-ease:cubic-bezier(.23,1,.32,1);position:relative;width:100%;max-width:370px;display:grid;gap:12px;font:14px/1.4 var(--font-geist-sans,system-ui)}
.tz-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 4px}
.tz-head>div:first-child{display:grid;gap:3px}
.tz-dateline{display:flex;align-items:center;gap:8px}
.tz-label{font-size:11px;font-weight:550;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tz-date{font-size:18px;font-weight:600;letter-spacing:-.015em;color:var(--fg)}
.tz-now{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px 0 7px;font-size:12px!important;border:0;border-radius:99px;background:var(--band,rgb(0 0 0/.05));
  color:var(--fg);font:500 13px/1 var(--font-geist-sans,system-ui);cursor:pointer;-webkit-tap-highlight-color:transparent;
  transition:opacity 200ms var(--tz-ease),transform 200ms var(--tz-ease),background-color 150ms var(--tz-ease)}
.tz-now svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.tz-now[data-hidden]{opacity:0;transform:scale(.9);pointer-events:none}
.tz-now:active{transform:scale(.95)}
.tz-now:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
@media(hover:hover) and (pointer:fine){.tz-now:hover{background:color-mix(in srgb,var(--fg) 10%,transparent)}}
/* The scrubber: hour marks over a strip of sky that runs from night through dawn, day and dusk. */
.tz-scrub{position:relative;margin:0 -4px 2px;color:var(--fg)}
.tz-needle{position:absolute;z-index:1;top:17px;bottom:0;left:50%;width:2px;margin-left:-1px;border-radius:1px;background:var(--fg);pointer-events:none}
.tz-tick{display:grid;justify-items:center;align-self:stretch;grid-template-rows:12px 1fr;gap:3px;width:10px;padding:2px 0 13px}
.tz-strip{position:absolute;left:0;right:0;bottom:6px;height:4px;background-size:960px 100%;background-repeat:repeat-x;filter:saturate(1.15);
  -webkit-mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)}
.tz-tick span{font:500 9.5px/12px var(--font-geist-mono,ui-monospace,monospace);color:var(--muted);white-space:nowrap}
.tz-tick i{align-self:end;width:1px;height:6px;background:currentColor;opacity:.28}
.tz-tick[data-hour] i{width:1.5px;height:11px;opacity:.75}
/* The cities, on one card. */
.tz-list{list-style:none;margin:0!important;padding:4px 14px!important;display:grid;border-radius:16px;
  /* A breath of the sky's colour at the top, fading out a third of the way down. */
  background:linear-gradient(180deg,color-mix(in srgb,var(--tz-tint,transparent) 9%,var(--band,rgb(0 0 0/.04))),var(--band,rgb(0 0 0/.04)) 40%)}
/* A soft highlight along the card's top edge, brightest in the middle, with a faint glow just under it. */
.tz-list{position:relative}
.tz-list::before{content:'';position:absolute;left:18%;right:18%;top:0;height:1px;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgb(255 255 255/.22),transparent)}
.tz-list::after{content:'';position:absolute;left:25%;right:25%;top:0;height:14px;pointer-events:none;
  background:radial-gradient(50% 100% at 50% 0,rgb(255 255 255/.04),transparent)}
.tz-list li{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:7px 0;margin:0!important}
.tz-sky{flex:none;border-radius:50%;overflow:hidden;outline:1px solid color-mix(in srgb,var(--fg) 9%,transparent);outline-offset:2px}
.tz-sun{filter:drop-shadow(0 0 2.2px rgb(255 205 110/.85))}
.tz-moon{fill:#f5f2e8;filter:drop-shadow(0 0 1.8px rgb(240 236 220/.6))}
.tz-earthshine{fill:#a9b2d6;opacity:.14}
.tz-stars circle{fill:#fff;animation:tz-twinkle 5s ease-in-out infinite alternate}
@keyframes tz-twinkle{from{opacity:.95}to{opacity:.25}}
.tz-shoot{stroke-width:.65;stroke-linecap:round;opacity:0;filter:drop-shadow(0 0 .5px #fff);animation:tz-shoot 12s cubic-bezier(.3,.6,.4,1) infinite}
@keyframes tz-shoot{0%{transform:translate(25px,3px) rotate(152deg);opacity:0}.8%{opacity:1}4.5%{opacity:.9}7%{transform:translate(8px,12px) rotate(152deg);opacity:0}100%{transform:translate(8px,12px) rotate(152deg);opacity:0}}
.tz-corona{stroke:#ffe6a6;stroke-width:.7;stroke-linecap:round;opacity:.45;animation:tz-spin 40s linear infinite}
@keyframes tz-spin{to{transform:rotate(360deg)}}
/* The plane's flight: across in the first third of its cycle; the trail draws behind it, then spreads and fades. */
/* (Its duration and delay are set on .tz-flight, per city, and inherited by the plane and its trail.) */
.tz-plane{fill:#fff;filter:drop-shadow(0 0 .6px #fff);transform:translate(-6px,9.75px);
  animation-name:tz-plane;animation-duration:inherit;animation-delay:inherit;animation-iteration-count:infinite;animation-timing-function:linear}
@keyframes tz-plane{0%{transform:translate(-4px,9.5px)}32%,100%{transform:translate(36px,4.5px)}}
.tz-trail{fill:none;stroke:#fff;stroke-width:.55;stroke-linecap:round;stroke-dasharray:1 1;stroke-dashoffset:1;opacity:.75;
  animation-name:tz-trail;animation-duration:inherit;animation-delay:inherit;animation-iteration-count:infinite;animation-timing-function:linear}
@keyframes tz-trail{0%{stroke-dashoffset:1;opacity:.75;stroke-width:.4}32%{stroke-dashoffset:0;opacity:.6;stroke-width:.6}60%{stroke-dashoffset:0;opacity:0;stroke-width:1.3}100%{stroke-dashoffset:0;opacity:0}}
.tz-birds{fill:none;stroke:rgb(30 36 52/.75);stroke-width:.35;stroke-linecap:round;stroke-linejoin:round;opacity:0;animation:tz-birds 40s linear infinite}
@keyframes tz-birds{0%{transform:translate(-6px,17px);opacity:1}22%{transform:translate(34px,13px);opacity:1}23%,100%{transform:translate(34px,13px);opacity:0}}
.tz-birds path{transform-box:fill-box;transform-origin:center;animation:tz-flap .5s ease-in-out infinite alternate}
.tz-birds path+path{animation-delay:-.2s}
@keyframes tz-flap{to{transform:scaleY(.35)}}
.tz-cloud{transform:translate(var(--x,6px),var(--y,8px));animation:tz-drift 80s linear infinite}
.tz-cloud1{animation-duration:84s}
.tz-cloud2{animation-duration:118s}
@keyframes tz-drift{from{transform:translate(-12px,var(--y,8px))}to{transform:translate(34px,var(--y,8px))}}
.tz-cloud1{--y:7px}
.tz-cloud2{--y:14px;--x:19px}
.tz-cloud3{--y:3px;--x:14px;animation-duration:102s}
.tz-cloud4{--y:11px;--x:2px;animation-duration:136s}
/* Weather. */
.tz-rain line{stroke:rgb(205 218 238/.75);stroke-width:.24;stroke-linecap:round;animation:tz-fall .62s linear infinite}
@keyframes tz-fall{from{transform:translate(1px,-3px)}to{transform:translate(-3px,33px)}}
.tz-snowfall circle{fill:#fff;opacity:.9;animation:tz-flake 5.5s linear infinite}
@keyframes tz-flake{from{transform:translate(0,-2px)}50%{transform:translate(calc(var(--k)*1.2px),15px)}to{transform:translate(calc(var(--k)*-.6px),33px)}}
.tz-flash{fill:#eef2ff;opacity:0;animation:tz-flash 8s linear infinite}
.tz-bolt{fill:#fff7d6;opacity:0;filter:drop-shadow(0 0 1px #fff);animation:tz-flash 8s linear infinite}
@keyframes tz-flash{0%,88%{opacity:0}88.6%{opacity:.75}89.4%{opacity:0}90.4%{opacity:.5}91.6%,100%{opacity:0}}
.tz-fog rect{fill:rgb(235 238 245/.55);animation:tz-mist 26s ease-in-out infinite alternate}
.tz-fog2{animation-duration:34s!important}
@keyframes tz-mist{to{transform:translateX(-8px)}}
.tz-rim{fill:none;stroke-width:.7;stroke-linecap:round}
.tz-windows rect{fill:#ffd27a;opacity:0;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 0 .8px rgb(255 200 110/.9));transition:opacity .6s var(--tz-ease)}
.tz-windows rect[data-on]{opacity:1;animation:tz-flare .55s var(--tz-ease)}
@keyframes tz-flare{0%{opacity:0;transform:scale(.4)}35%{opacity:1;transform:scale(1.7)}100%{transform:scale(1)}}
.tz-grain{display:var(--tz-grain,inline);opacity:.32;mix-blend-mode:soft-light;pointer-events:none}
.tz-mark{display:inline-block;margin-right:1px;vertical-align:-.5px;fill:none;stroke:currentColor;stroke-width:1.1;stroke-linecap:round}
.tz-city{display:grid;gap:1px;min-width:0}
.tz-name{display:flex;align-items:center;gap:6px;font-weight:550;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tz-you{padding:1px 5px;border-radius:4px;font-size:9.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;background:var(--fg);color:var(--bg)}
.tz-meta{font-size:12px;color:var(--muted);white-space:nowrap}
.tz-list li[data-state=Working] .tz-meta>:last-child{color:#1f9d55}
.tz-when{display:grid;justify-items:end;gap:1px}
.tz-clockface{display:flex;align-items:baseline;gap:3px}
.tz-half{font:600 9.5px/1 var(--font-geist-mono,ui-monospace,monospace);letter-spacing:.04em;color:var(--muted)}
.tz-tools{display:flex;align-items:center;gap:6px}
/* 12h / 24h: a small segmented switch; its thumb slides. */
.tz-clock{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:2px;border-radius:99px;background:var(--band,rgb(0 0 0/.05))}
.tz-clock-thumb{position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:99px;background:var(--bg,#fff);
  box-shadow:0 1px 2px rgb(0 0 0/.1),0 0 0 .5px rgb(0 0 0/.06);transform:translateX(100%);transition:transform 220ms var(--tz-ease)}
.tz-clock[data-h12] .tz-clock-thumb{transform:none}
.tz-clock button{position:relative;height:24px;padding:0 9px;border:0;border-radius:99px;background:none;color:var(--muted);cursor:pointer;
  font:500 11.5px/1 var(--font-geist-mono,ui-monospace,monospace);-webkit-tap-highlight-color:transparent;transition:color 150ms var(--tz-ease)}
.tz-clock button[aria-pressed=true]{color:var(--fg)}
.tz-clock button:focus-visible{outline:2px solid var(--fg);outline-offset:-1px}
@media(hover:hover) and (pointer:fine){.tz-clock button:hover{color:var(--fg)}}
.tz-time{font:500 15px/1.2 var(--font-geist-mono,ui-monospace,monospace);letter-spacing:-.02em;color:var(--fg);transition:opacity 250ms var(--tz-ease)}
.tz-list li[data-state=Asleep] .tz-time{opacity:.45}
.tz-day{font-size:11.5px;color:var(--muted)}
.tz-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* The rest of the cities: the list grows open; the button's plus turns into a minus. */
.tz-list ul{list-style:none;margin:0!important;padding:0!important;display:grid}
.tz-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows 320ms var(--tz-ease)}
.tz-more[data-open]{grid-template-rows:1fr}
.tz-more:not([data-open]) *{animation-play-state:paused!important}
/* It clips while it opens: a few pixels of room either side, so the skies' rings are not cut. */
.tz-more>div{min-height:0;overflow:hidden;margin:0 -6px;padding:0 6px}
.tz-viewmore{justify-self:center;display:inline-flex;align-items:center;gap:6px;height:28px;margin:2px 0 4px;padding:0 12px;border:0;border-radius:99px;background:none;
  color:var(--muted);font:500 12.5px/1 var(--font-geist-sans,system-ui);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color 150ms var(--tz-ease),background-color 150ms var(--tz-ease)}
.tz-viewmore svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round}
.tz-plus{transform-origin:6px 6px;transition:transform 250ms var(--tz-ease)}
.tz-viewmore[aria-expanded=true] .tz-plus{transform:rotate(90deg) scaleY(0)}
.tz-viewmore:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
@media(hover:hover) and (pointer:fine){.tz-viewmore:hover{color:var(--fg);background:color-mix(in srgb,var(--fg) 5%,transparent)}}
/* The enlarged sky: it grows out of the little one (32 of its 88 px) and shrinks back into it. */
.tz-lens{position:absolute;z-index:3;left:-44px;top:-44px;width:88px;height:88px;--tz-grain:none;border-radius:50%;overflow:hidden;pointer-events:none;
  background:var(--bg);box-shadow:0 0 0 1px color-mix(in srgb,var(--fg) 12%,transparent),0 16px 32px -10px rgb(0 0 0/.42),0 6px 12px -4px rgb(0 0 0/.18),0 1px 3px rgb(0 0 0/.1);
  opacity:0;scale:.36;transition:opacity 150ms var(--tz-ease),scale 220ms var(--tz-ease),translate 160ms var(--tz-ease)}
.tz-lens[data-on]{opacity:1;scale:1}
.tz-lens svg{display:block;width:100%;height:100%}
/* The glass: a faint highlight up and to the left, a touch of shade at the rim, and a thin white ring. (No backdrop
   blur, and no grain inside: both would be redrawn on every move.) */
.tz-lens::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at 32% 26%,rgb(255 255 255/.2),transparent 34%),radial-gradient(circle,transparent 64%,rgb(0 0 0/.12));
  box-shadow:inset 0 0 0 1.5px rgb(255 255 255/.38),inset 0 1px 3px rgb(255 255 255/.25)}
@media not ((hover:hover) and (pointer:fine)){.tz-lens{display:none}}
/* City lights: floodlit landmarks, aviation beacons, the Eye's rim, the harbour's reflections. */
.tz-warm{fill:#ffd9a0;filter:drop-shadow(0 0 .6px rgb(255 200 120/.9))}
.tz-orange{fill:#ff7a2e;filter:drop-shadow(0 0 1px rgb(255 120 50/.9))}
.tz-gold{fill:#ffc95c;filter:drop-shadow(0 0 1px rgb(255 190 80/.85))}
.tz-pale{fill:#f2f4ff;filter:drop-shadow(0 0 1px rgb(220 230 255/.9))}
.tz-beam{fill:rgb(255 240 200/.16);transform-origin:19px 6.8px;animation:tz-sweep 7s ease-in-out infinite alternate}
@keyframes tz-sweep{from{transform:rotate(-38deg) scaleX(.6)}50%{transform:rotate(0) scaleX(1)}to{transform:rotate(38deg) scaleX(.6)}}
.tz-sparkle circle{fill:#fff;filter:drop-shadow(0 0 .5px #fff);animation:tz-glitter .5s steps(2) infinite}
@keyframes tz-glitter{50%{opacity:.1}}
.tz-camel{transform:translate(-4px,22.6px);animation:tz-camel 60s linear infinite}
@keyframes tz-camel{0%{transform:translate(-4px,22.9px)}60%,100%{transform:translate(34px,22.6px)}}
.tz-bondinho{transform:translate(18px,21.5px);animation:tz-bondinho 26s ease-in-out infinite alternate}
@keyframes tz-bondinho{from{transform:translate(18.4px,21.2px)}to{transform:translate(24.6px,16.6px)}}
.tz-lavender{fill:#b9a4ff;filter:drop-shadow(0 0 1px rgb(170 150 255/.8))}
.tz-eye-lit{stroke:#ff9cc8;filter:drop-shadow(0 0 .8px rgb(255 140 200/.9))}
.tz-eye{transform-origin:18px 17.3px;animation:tz-spin 240s linear infinite}
.tz-beacon{fill:#ff3b30;filter:drop-shadow(0 0 .6px rgb(255 60 50/.9));animation:tz-blink 1.8s steps(1) infinite}
@keyframes tz-blink{0%{fill-opacity:1}50%{fill-opacity:.1}}
.tz-sails{filter:drop-shadow(0 0 .5px rgb(255 250 235/.35))}
/* The gags. Each on its own slow schedule; still, and out of sight, with reduced motion. */
.tz-cablecar{transform:translate(4px,16px);animation:tz-cable 36s ease-in-out infinite alternate}
@keyframes tz-cable{from{transform:translate(4px,15.9px)}to{transform:translate(27px,18.8px)}}
.tz-kong{transform-box:fill-box;transform-origin:50% 100%;animation:tz-beat 7s ease-in-out infinite}
.tz-kong-climb{opacity:0;transform:translateY(13px);animation:tz-climb 46s ease-in-out infinite}
@keyframes tz-climb{0%,48%{opacity:0;transform:translateY(13px)}50%{opacity:1;transform:translateY(12px)}62%{transform:translateY(5px)}66%,86%{opacity:1;transform:none}96%{opacity:1;transform:translateY(12px)}98%,100%{opacity:0;transform:translateY(13px)}}
@keyframes tz-beat{0%,86%,100%{transform:none}89%,95%{transform:scale(1.12,.94)}92%,98%{transform:scale(.94,1.04)}}
.tz-biplane{transform:translate(4.2px,0);transform-origin:0 0;animation:tz-circle 9s linear infinite}
@keyframes tz-circle{from{transform:rotate(0) translate(4.2px,0) rotate(90deg)}to{transform:rotate(360deg) translate(4.2px,0) rotate(90deg)}}
.tz-bus{transform:translate(-4px,24.1px);animation:tz-bus 30s linear infinite}
@keyframes tz-bus{0%{transform:translate(-4px,24.1px)}26%,100%{transform:translate(34px,24.1px)}}
.tz-train{transform:translate(-8px,24.55px);animation:tz-train 17s cubic-bezier(.4,0,.6,1) infinite}
@keyframes tz-train{0%{transform:translate(-8px,24.55px)}6%,100%{transform:translate(34px,24.55px)}}
.tz-whale{transform:translate(24px,28.6px) scale(1,0);animation:tz-whale 23s ease-in-out infinite}
@keyframes tz-whale{0%,62%{transform:translate(24px,28.6px) scale(1,0)}66%,71%{transform:translate(24px,28.6px) scale(1,1)}76%,100%{transform:translate(24.6px,28.6px) scale(1,0)}}
.tz-glint,.tz-ripple{transform-box:fill-box;transform-origin:center;animation:tz-shimmer 2.4s ease-in-out infinite alternate}
.tz-ripple{animation-duration:1.7s}
@keyframes tz-shimmer{to{transform:scale(1.35,.8)}}
@media(prefers-reduced-motion:reduce){.tz *{transition:none!important;animation:none!important}}

`

  /** The site's theme variables, for a page that does not define them. */
  export const theme = String.raw`
.tz{--bg:#fff;--fg:#0a0a0a;--muted:#6b6b6b;--line:#00000014;--band:#0000000a;--accent:#ff5a1f}
@media(prefers-color-scheme:dark){.tz{--bg:#0a0a0a;--fg:#ededed;--muted:#8f8f8f;--line:#ffffff1a;--band:#ffffff0f}}
`
</script>
