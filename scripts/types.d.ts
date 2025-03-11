declare module 'svg2png' {
  function svg2png(
    sourceBuffer: Buffer,
    options?: { width?: number; height?: number }
  ): Promise<Buffer>;
  export = svg2png;
} 