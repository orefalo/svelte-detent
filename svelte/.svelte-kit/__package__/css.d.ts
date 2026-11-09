/** Inline styles as an object (camelCase or kebab-case keys, numbers get `px` where a length is meant). */
type StringKeys = {
    [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never;
}[keyof CSSStyleDeclaration];
export type CSSProperties = {
    [K in Exclude<StringKeys, 'length' | 'cssText' | 'parentRule'>]?: string | number | null;
} & {
    [custom: `--${string}`]: string | number | null | undefined;
};
/** `{ marginTop: 4, '--x': 1 }` → `margin-top:4px;--x:1`. Nullish, false and empty values are left out. */
export declare function cssText(style: Record<string, unknown> | undefined | null): string;
/** The declarations of a style string, by property name (kebab-case). */
export declare function parseStyle(style: string | undefined | null): Record<string, string>;
/** Accepts either form of the `style` prop. */
export declare const styleMap: (style: string | CSSProperties | undefined | null) => Record<string, string>;
export {};
