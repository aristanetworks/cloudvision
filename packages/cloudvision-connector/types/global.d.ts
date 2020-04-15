declare namespace NodeJS {
  export interface Global {
    document: Document;
    window: Window;
    navigator: {
      userAgent: 'node.js';
    };
    WebSocket: WebSocket;
    TextDecoder: unknown;
    TextEncoder: unknown;
  }
}
