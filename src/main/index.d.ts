export {};

declare global {
  interface Window {
    dataLayer: any;
    dtrum: any;
    gtag: (...args: unknown[]) => void;
  }
}
