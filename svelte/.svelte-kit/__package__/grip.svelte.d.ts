import type { DetentApi } from './types';
interface Config {
    amount: number;
    pitch: number;
    vertical: boolean;
    rtl: boolean;
    disabled: boolean;
}
/** A short visual catch, composed above the tracks. Pointer control and selection remain immediate. */
export declare function useGrip<T>(d: DetentApi<T>, root: () => HTMLElement | null, config: () => Config): void;
export {};
