import { type SpringConfig } from '@hayderkg/detent/core';
import type { HTMLAttributes } from 'svelte/elements';
import { type CSSProperties } from './css';
interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'class'> {
    /** The current label. No list of possible values is needed. Numbers are converted to strings. */
    text: string | number;
    as?: 'span' | 'div' | 'p' | 'label' | 'strong' | 'em' | 'small' | 'output' | 'code' | 'pre' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    /** Keep matching graphemes; false rolls the entire label. Default true. */
    morph?: boolean;
    /** Disable transitions. Reduced motion is always respected. */
    animate?: boolean;
    /** Locale used for grapheme segmentation; format numbers before passing them if needed. */
    locale?: string;
    spring?: Partial<SpringConfig>;
    /** Maximum spring duration in milliseconds. Default 550. */
    snapDuration?: number;
    rollDirection?: 'up' | 'down';
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onAnimationCancel?: () => void;
    class?: string;
    style?: string | CSSProperties;
    /** The root element. */
    ref?: HTMLElement | null;
}
declare const DetentText: import("svelte").Component<Props, {}, "ref">;
type DetentText = ReturnType<typeof DetentText>;
export default DetentText;
