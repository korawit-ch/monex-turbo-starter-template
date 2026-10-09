declare module '*.svg' {
  const asset: import('next/image').StaticImageData;
  export default asset;
}
