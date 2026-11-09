import type { DetentApi, DetentOptions } from './types';
/** The CSS variables of a row at distance `off` from the center. */
export declare const rowVars: (off: number, visible: number) => [string, string][];
/**
 * The headless wheel: physics, input, virtualization and accessibility, with no markup of its own.
 *
 *     const d = createDetent(() => ({ items, value, onChange }))
 *
 * `options` is a function so that reactive values (props, `$state`) are read where they change.
 * Everything stateful lives in this closure; Svelte only re-renders when rows or the selection change, and the
 * per-frame position (track transform, row CSS variables) is written straight to the DOM.
 */
export declare function createDetent<T>(options: () => DetentOptions<T>, id?: string): DetentApi<T>;
