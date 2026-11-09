import type { CSSProperties } from './css';
import type { DetentApi, Key } from './types';
export type IndicatorShape = 'rounded' | 'pill' | 'lines' | 'underline' | 'brackets' | 'dot' | 'needle' | 'none';
export type IndicatorMaterial = 'solid' | 'glass' | 'outline' | 'gradient-border';
export interface IndicatorOptions<T> {
    /** Default 'rounded'. 'lines' = iOS hairlines; 'needle' = a line through the center (rulers). */
    shape?: IndicatorShape;
    /** Default 'solid'. 'glass' = backdrop blur, hairline border, inner highlight. */
    material?: IndicatorMaterial;
    /** 'band' (default): spans the wheel. 'content': follows the centered item's size, morphing between items. */
    fit?: 'band' | 'content';
    /** With fit 'content': also follow the item's height (width only by default). */
    fitHeight?: boolean;
    /** Space around the content with fit 'content'. Defaults 14 and 6. */
    paddingX?: number;
    paddingY?: number;
    minWidth?: number;
    maxWidth?: number;
    radius?: number;
    /** Accent (lines, outline, underline, brackets, dot, needle, gradient border, tint). A function cross-fades per item. */
    color?: string | ((item: T) => string);
    background?: string;
    border?: string;
    /** true = lifted, 'inset' = pressed, or any box-shadow. */
    shadow?: boolean | 'inset' | string;
    /** Gap from the wheel's sides with fit 'band'. Default 6. */
    inset?: number;
    /** 0–1: let the size overshoot with the settle spring. Default 0 (lands exactly). */
    overshoot?: number;
    /** Brief compression/rebound of a box indicator after motion settles. true = subtle; a number sets intensity (0–1). Off by default. */
    impact?: boolean | number;
    /** Optical distortion inside the selection lens. true = 0.5, or strength 0–4 (progressively limited above 2). Off by default; disabled with reduced motion. */
    refraction?: boolean | number;
    /** Move refraction into the center instead of the edges (the original lens effect). Default false; requires refraction. */
    refractionInverse?: boolean;
    /** Subtle RGB dispersion through the refraction lens. true = 0.35, or intensity 0–1. Off by default; requires refraction. */
    refractionRGB?: boolean | number;
    /**
     * Rows before the target where the indicator starts catching the incoming item (throws, keys and
     * programmatic moves). Before that it holds steady. Default 1.5.
     */
    catchRows?: number;
    /**
     * 'smart' (default): speed-aware smoothing, holds while rows pass, catches the target. 'naive': recompute the
     * width every frame from the two rows around the center (flickers on fast spins; useful to compare).
     */
    morph?: 'smart' | 'naive';
}
export interface IndicatorState<T> {
    width: number;
    height: number;
    progress: number;
    velocity: number;
    item: T | undefined;
}
interface Config<T> {
    opts: IndicatorOptions<T>;
    items: readonly T[];
    keyOf: (item: T, index: number) => Key;
    loop: boolean;
    vertical: boolean;
    /** Along-axis band size (the item size), px. */
    item: number;
    /** Row pitch (item + gap), px: converts engine px to rows. */
    pitch: number;
}
/**
 * Drives the indicator from engine frames: size (fit content) and color, written as CSS variables on
 * the root. No renders, no layout reads in the frame loop: content sizes come from ResizeObserver.
 */
export declare function useIndicator<T>(d: DetentApi<T>, root: () => HTMLElement | null, track: () => HTMLElement | null, cfg: () => Config<T>): {
    state: {
        w: number;
        h: number;
        cp: number;
        wFrom: number;
        hFrom: number;
        cFrom: string;
        motion: number;
        held: number;
        t: number;
        rem0: number;
    };
    apply: () => void;
};
/** Static styles for the indicator box (shape × material); sizes come from --indicator-w / --indicator-h. */
export declare function indicatorStyle<T>(o: IndicatorOptions<T>, vertical: boolean): CSSProperties;
export {};
