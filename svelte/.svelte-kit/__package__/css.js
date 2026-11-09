const UNITLESS = new Set([
    'opacity', 'z-index', 'flex', 'flex-grow', 'flex-shrink', 'order', 'line-height', 'font-weight', 'scale', 'zoom',
    'aspect-ratio', 'tab-size', 'orphans', 'widows', 'grid-row', 'grid-column', 'column-count',
]);
const kebab = (key) => (key.startsWith('--') ? key : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
/** `{ marginTop: 4, '--x': 1 }` → `margin-top:4px;--x:1`. Nullish, false and empty values are left out. */
export function cssText(style) {
    if (!style)
        return '';
    let out = '';
    for (const key in style) {
        const value = style[key];
        if (value == null || value === false || value === '')
            continue;
        const name = kebab(key);
        out += `${name}:${typeof value === 'number' && !name.startsWith('--') && !UNITLESS.has(name) && value !== 0 ? `${value}px` : value};`;
    }
    return out;
}
/** The declarations of a style string, by property name (kebab-case). */
export function parseStyle(style) {
    const out = {};
    if (!style)
        return out;
    let depth = 0;
    let start = 0;
    const take = (end) => {
        const part = style.slice(start, end);
        const at = part.indexOf(':');
        if (at > 0)
            out[part.slice(0, at).trim().toLowerCase()] = part.slice(at + 1).trim();
    };
    for (let i = 0; i < style.length; i++) {
        const c = style[i];
        if (c === '(')
            depth++;
        else if (c === ')')
            depth = Math.max(0, depth - 1);
        else if (c === ';' && !depth)
            (take(i), (start = i + 1));
    }
    take(style.length);
    return out;
}
/** Accepts either form of the `style` prop. */
export const styleMap = (style) => (typeof style === 'string' ? parseStyle(style) : parseStyle(cssText(style)));
