import type { DetentApi } from './types';
/** Edge glass leaves the central 60% flat; inverse preserves the original center lens. */
export declare function refractionMap(vertical: boolean, inverse?: boolean): string;
interface Config {
    id: string;
    amount: number;
    rgb: number;
    inverse: boolean;
    vertical: boolean;
    item: number;
    extent: number;
    band: () => number;
}
type El<E> = () => E | null | undefined;
export declare function useRefraction<T>(d: DetentApi<T>, root: El<HTMLElement>, image: El<SVGFEImageElement>, displacement: El<SVGFEDisplacementMapElement>, config: () => Config, chroma?: El<SVGFEOffsetElement>[]): void;
export {};
