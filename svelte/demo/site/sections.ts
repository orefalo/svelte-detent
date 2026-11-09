/** The structure and copy of detent.hayder.sh/examples. `file` is the example in ../examples. */
export interface Example { id: string; title: string; description: string; file: string }
export interface Section { id: string; title: string; description: string; examples: Example[] }

const ex = (title: string, description: string, file: string): Example => ({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), title, description, file })

export const intro = "Every example runs live, exactly as it would in your app. A few sit in a small scene, to show them in context."

export const sections: Section[] = [
  {
    id: 'pickers',
    title: 'Pickers',
    description: 'Choosing a value: time, date, time zones, type, words, weight, assets, colors, actions, images.',
    examples: [
      ex('iOS time picker', 'Hours, minutes and AM/PM on three looping wheels that share one band.', 'IosTimePicker'),
      ex('Date picker', "Day, month and year, linked; days that don't exist that month are skipped.", 'DatePicker'),
      ex('Time zones', "Scrub Madrid's day and every city follows: clocks roll, days flip at midnight, and each city sits under its real sky, sun and moon where they stand on that date, over its own skyline.", 'TimeZones'),
      ex('Split the bill', 'Tip and people on two wheels; each share, the tip and the total roll by decimal place as you turn them.', 'SplitTheBill'),
      ex('Variable font', 'A wheel per axis of a variable font. The text morphs between steps as you turn, and each wheel is set in its own values.', 'VariableFont'),
      ex('Word wheel', 'A word that turns inside a sentence, with an indicator that hugs each word.', 'WordWheel'),
      ex('Dynamic sentence', 'The homepage sentence: a wheel, matching-letter text and rolling numbers, composed in one line.', 'DynamicSentence'),
      ex('Weight dial', 'Pick a weight on a dial: a half-ring of ticks turns under a fixed needle. Headless, drawn in SVG.', 'WeightDial'),
      ex('Token list', "Rich rows: logos, prices, sparklines, and the day's change in green or red.", 'TokenList'),
      ex('Color wheel', 'A wheel that tints the surface behind it, frame by frame.', 'ColorWheel'),
      ex('Action wheel', 'Rows with real switches and buttons; only the centered row takes input.', 'ActionWheel'),
      ex('Image wheel', 'Stamps on a drum, sideways or upright; the ones off center fade to monochrome.', 'ImageWheel'),
    ],
  },
  {
    id: 'beyond-pickers',
    title: 'Beyond pickers',
    description: 'The same mechanism, used for browsing, playing and displaying.',
    examples: [
      ex('Carousel', 'Flat cards or cover flow, endless, and mirrored for right-to-left languages.', 'Carousel'),
      ex('Stories', 'A vertical pager: one story in view, auto-advancing; swipe to browse.', 'Stories'),
      ex('Password lock', 'A combination lock that reads your password: each rule turns a drum, which lands on a check once the rule is met. With a show/hide eye that keeps your caret.', 'PasswordLock'),
      ex('FM radio', 'A tuning dial in 0.1 MHz steps. Static between stations, music fading in as the needle nears one: the sound follows the dial frame by frame.', 'FmRadio'),
      ex('Zoom ring', 'A lens ring: the photo zooms as you turn it, with a click per step.', 'ZoomRing'),
      ex('Arc menu', 'A section menu that fans out from its button. The arc is rowStyle on a flat <Detent>.', 'ArcMenu'),
      ex('Reaction strip', 'A horizontal strip with a big magnifier on the chosen emoji.', 'ReactionStrip'),
      ex('Detent Number', 'Prices, counters and percentages that roll by decimal place. Digits stay aligned as signs, separators and columns come and go. Formatted with Intl.NumberFormat.', 'NumberDemo'),
      ex('Detent Text', 'Animate changing labels with a wheel-like roll. Keep matching letters in place, or roll the whole phrase. Native text at rest, interruptible in motion.', 'TextDemo'),
      ex('Departures board', 'A split-flap board built from DetentText: only the letters that change turn, each in its own tile, row by row.', 'DeparturesBoard'),
      ex('Odometer', 'One wheel per digit, turning to a live number; input is off.', 'Odometer'),
      ex('Slot machine', "Reels spun from code, each landing on an exact symbol with the wheel's own spring.", 'SlotMachine'),
    ],
  },
  {
    id: 'techniques',
    title: 'Techniques',
    description: 'Your own markup, and lists that keep growing.',
    examples: [
      ex('Headless', 'createDetent with your own markup and CSS. Focus it and try the keyboard.', 'Headless'),
      ex('Load more', 'Pages in more rows near the end; only the visible ones are rendered.', 'LoadMore'),
    ],
  },
  {
    id: 'custom-interactions',
    title: 'Custom interactions with the headless hook',
    description: 'Every frame, createDetent reports where the wheel is and how fast it moves, through subscribe. These effects are example implementations built on that, not part of the package.',
    examples: [
      ex('Liquid', 'A WebGL shader: cards stretch toward the edges, smear with speed and split into color at the outline.', 'Liquid'),
      ex('Dust', 'Words made of particles. Swipe sideways: each one comes apart and flies into the next, and a fast throw scatters them wider.', 'Dust'),
      ex('Riso', 'Photos printed in two inks as a halftone. Turn it: each print dissolves into the next, dot by dot, and speed pulls the plates out of register.', 'Riso'),
    ],
  },
]
