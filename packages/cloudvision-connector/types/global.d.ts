declare namespace NodeJS {
  export interface Global {
    document: Document;
    window: Window;
    WebSocket: WebSocket;
    TextDecoder: typeof TextDecoder;
    TextEncoder: typeof TextEncoder;
  }
}
