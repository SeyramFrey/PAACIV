// heic-decode ne publie pas ses types.
declare module 'heic-decode' {
  type ImageDecodee = { width: number; height: number; data: Uint8ClampedArray }
  function decoderHeic(options: { buffer: Buffer | Uint8Array | ArrayBuffer }): Promise<ImageDecodee>
  export default decoderHeic
}
