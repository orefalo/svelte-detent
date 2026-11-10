// The framework-free half of detent: physics, engine, presets and the rolling-label controllers.
// Framework bindings (svelte-detent) build on this entry; it never imports React.
export * from './physics'
export { ios, presets, resolvePhysics } from './presets'
export type { Physics, PhysicsOptions, PresetName } from './presets'
export { createEngine } from './engine/engine'
export type { Engine, EngineOptions, KeyAcceleration, Mode, Orientation, WheelMode } from './engine/engine'
export { textController } from './text/controller'
export type { TextOptions } from './text/controller'
export { numberController } from './number/controller'
export { tokens as numberTokens, glyphsOf as numberGlyphs } from './number/tokens'
export type { Token as NumberToken } from './number/tokens'
export type { RollOptions } from './text/roll'
