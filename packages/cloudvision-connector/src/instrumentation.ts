import { ContextCommand, RequestContext, WsCommand } from '../types';

export interface InstrumentationConfig {
  commands: WsCommand[];
  start(context: RequestContext): void;
  info(context: RequestContext): void;
  end(context: RequestContext): void;
}

type Info = {
  error?: string;
  message?: string;
};

// Use empty function as a default placeholder
/* istanbul ignore next */
function emptyFunction(): void {} // eslint-disable-line @typescript-eslint/no-empty-function

export default class Instrumentation {
  private enableInstrumentation = false;

  private instrumentedCommands: WsCommand[];

  private startFunction: (context: RequestContext) => void;

  private infoFunction: (context: RequestContext, info: Info) => void;

  private endFunction: (context: RequestContext) => void;

  public constructor(config?: InstrumentationConfig) {
    if (config) {
      this.enableInstrumentation = true;
    }
    this.instrumentedCommands = config ? config.commands : [];
    this.startFunction = config ? config.start : emptyFunction;
    this.infoFunction = config ? config.info : emptyFunction;
    this.endFunction = config ? config.end : emptyFunction;
  }

  public callStart(command: ContextCommand, context: RequestContext): void {
    if (this.enableInstrumentation && this.instrumentedCommands.includes(command as WsCommand)) {
      this.startFunction(context);
    }
  }

  public callInfo(command: ContextCommand, context: RequestContext, info: Info): void {
    if (this.enableInstrumentation && this.instrumentedCommands.includes(command as WsCommand)) {
      this.infoFunction(context, info);
    }
  }

  public callEnd(command: ContextCommand, context: RequestContext): void {
    if (this.enableInstrumentation && this.instrumentedCommands.includes(command as WsCommand)) {
      this.endFunction(context);
    }
  }
}
