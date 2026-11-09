import type { DetentApi } from './types';
type Layer = () => HTMLElement | null;
interface Config {
    amount: number;
    pitch: number;
    vertical: boolean;
    rtl: boolean;
}
/** Small independent springs on the rendered rows. The engine, layout and selected position stay unchanged. */
export declare function useElasticRows<T>(d: DetentApi<T>, layers: Layer[], config: () => Config): void;
export {};
