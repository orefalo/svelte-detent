import { untrack } from 'svelte';
/** Edge glass leaves the central 60% flat; inverse preserves the original center lens. */
export function refractionMap(vertical, inverse = false) {
    const stops = Array.from({ length: inverse ? 17 : 18 }, (_, i) => {
        // Eight samples per edge, with a single flat segment spanning the reading area.
        const t = inverse ? i / 16 : i <= 8 ? i / 40 : (i + 23) / 40;
        const edge = Math.min(t, 1 - t) / 0.2;
        const bend = inverse ? Math.sin(t * Math.PI * 2) : edge < 1 ? Math.sin(edge * Math.PI) ** 2 * (t < 0.5 ? 1 : -1) : 0;
        const channel = Math.round(128 + bend * 127);
        return `<stop offset="${t}" stop-color="rgb(${vertical ? 128 : channel},${vertical ? channel : 128},128)"/>`;
    }).join('');
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><linearGradient id="g" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops}</linearGradient><path fill="url(#g)" d="M0 0h256v256H0z"/></svg>`)}`;
}
/** Safari, and every browser on iOS (all WebKit). */
const webkit = () => typeof navigator !== 'undefined' && /Apple/.test(navigator.vendor);
export function useRefraction(d, root, image, displacement, config, chroma = []) {
    const on = $derived(!!config().amount);
    const vertical = $derived(config().vertical);
    let update = () => { };
    // Option changes reach the filter even while the wheel rests (no frames).
    $effect(() => {
        config();
        update();
    });
    $effect(() => {
        const host = root();
        void vertical;
        if (!on || !host)
            return;
        const mq = matchMedia('(prefers-reduced-motion: reduce)');
        const extent0 = untrack(config).extent;
        let width = host.clientWidth || extent0;
        let height = host.clientHeight || extent0;
        let signature = '';
        const apply = () => {
            const c = config();
            const extent = c.vertical ? height : width;
            const measured = c.band();
            const band = Math.min(extent, Number.isFinite(measured) && measured > 0 ? measured : c.item);
            // Preserve the original 0–2 response; soften the extra range so sampling never folds.
            const strength = c.amount <= 2 ? c.amount : 2 + (c.amount - 2) / (c.amount - 1);
            const scale = mq.matches ? 0 : Math.min(12, band * (c.inverse ? 0.12 : 0.045)) * strength;
            // Split across the scroll axis: contours stay visible while the map masks the clear reading area.
            const spread = mq.matches ? 0 : c.rgb * Math.min(3, band * 0.15);
            const next = `${c.vertical}:${c.inverse}:${extent}:${band}:${scale}:${spread}:${c.id}`;
            if (next === signature)
                return;
            signature = next;
            host.style.setProperty('--detent-refraction-filter', mq.matches ? 'none' : `url(#${c.id})`);
            // WebKit renders this filter empty in user-space units (the default) on an HTML element, so the lens hid the
            // selected row: there it runs in fractions of the wheel's box (objectBoundingBox), each length divided by
            // its side (WebKit scales x by the width and y by the height). Elsewhere, the original user-space values.
            const box = webkit();
            const img = image();
            img?.parentElement?.setAttribute('primitiveUnits', box ? 'objectBoundingBox' : 'userSpaceOnUse');
            const along = box ? Math.max(1, extent) : 1;
            const across = box ? Math.max(1, c.vertical ? width : height) : 1;
            const share = (v) => (box ? String(v) : `${v * 100}%`);
            img?.setAttribute(c.vertical ? 'x' : 'y', '0');
            img?.setAttribute(c.vertical ? 'width' : 'height', share(1));
            img?.setAttribute(c.vertical ? 'y' : 'x', share((extent - band) / extent / 2));
            img?.setAttribute(c.vertical ? 'height' : 'width', share(band / extent));
            // Keep the sampling curve monotonic even at maximum strength (no folded or inverted letters).
            displacement()?.setAttribute('scale', String(scale / along));
            chroma.forEach((ref, i) => {
                ref()?.setAttribute(c.vertical ? 'dy' : 'dx', '0');
                ref()?.setAttribute(c.vertical ? 'dx' : 'dy', String((spread * (i ? 1 : -1)) / across));
            });
        };
        update = apply;
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
            const box = entries.find((e) => e.target === host)?.contentRect;
            if (box) {
                width = box.width || width;
                height = box.height || height;
            }
            apply();
        });
        ro?.observe(host);
        const band = host.querySelector('[data-detent-band]');
        if (band)
            ro?.observe(band);
        const off = d.subscribe(apply);
        mq.addEventListener('change', apply);
        untrack(apply);
        return () => { off(); ro?.disconnect(); mq.removeEventListener('change', apply); update = () => { }; host.style.removeProperty('--detent-refraction-filter'); };
    });
}
