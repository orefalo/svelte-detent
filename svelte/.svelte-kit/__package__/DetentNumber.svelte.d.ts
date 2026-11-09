import { type SpringConfig } from '@hayderkg/detent/core';
import type { HTMLAttributes } from 'svelte/elements';
import { type CSSProperties } from './css';
/** The parts of a formatted number that `classNames` can style. */
type NumberPart = 'integer' | 'fraction' | 'decimal' | 'group' | 'currency' | 'sign' | 'unit';
interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'class'> {
    value: number | bigint;
    /** Passed to `Intl.NumberFormat`, like `format`. */
    locales?: string | string[];
    format?: Intl.NumberFormatOptions;
    /** Which way the digits roll. `'auto'` (default): up when the value grows, down when it shrinks. */
    trend?: 'auto' | 'up' | 'down';
    /**
     * A class per part of the number, e.g. a smaller currency or fraction. The native text is then split into one span
     * per part, still one selectable, accessible label, and the rolling copies carry the same classes.
     */
    classNames?: Partial<Record<NumberPart, string>>;
    as?: 'span' | 'div' | 'p' | 'label' | 'strong' | 'em' | 'small' | 'output' | 'code' | 'data' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    /** Disable transitions. Reduced motion is always respected. */
    animate?: boolean;
    spring?: Partial<SpringConfig>;
    /** Maximum spring duration in milliseconds. Default 700. */
    snapDuration?: number;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onAnimationCancel?: () => void;
    class?: string;
    style?: string | CSSProperties;
    /** The root element. */
    ref?: HTMLElement | null;
}
declare const DetentNumber: import("svelte").Component<Props, {}, "ref">;
type DetentNumber = ReturnType<typeof DetentNumber>;
export default DetentNumber;
