import { grpc } from '@improbable-eng/grpc-web';
import { ControlFunctions, GrpcControlMessage, GrpcSource, RpcOptions } from '@types';
import { Subject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_CONTROL_FUNCTIONS: ControlFunctions<any> = {
  onHeaders(controlMessageSubject, _dataSubject, headers) {
    controlMessageSubject.next({ metadata: headers });
  },
  onMessage(_controlMessageSubject, dataSubject, response) {
    dataSubject.next(response);
  },
  onEnd(controlMessageSubject, dataSubject, code, message) {
    controlMessageSubject.next({ error: { code, message } });
    dataSubject.complete();
    controlMessageSubject.complete();
  },
};

/**
 * Runs [grpc.invoke](https://github.com/improbable-eng/grpc-web/blob/master/client/grpc-web/docs/invoke.md)
 * on the GRPC service and converts the response into two observable streams.
 * One is the `data` stream the other is the `message` stream. The message stream
 * contains GRPC metadata information, as well as any error messages.
 *
 * @param methodDescriptor The GRPC service method definition to be queried.
 * @param options Options to pass to eh GRPC call.
 * @param controlFunctions (optional) Implementation of the onHeaders, onMessage
 * and onEnd GRPC callbacks. This is where publishing to either the `data` or
 * `message` stream is done.
 * @returns An object with the properties `data` and `message`, which are
 * [RXJS Observables](https://rxjs.dev/api/index/class/Observable) that can be subscribed to.
 */
export function fromGrpcInvoke<Req extends grpc.ProtobufMessage, Res extends grpc.ProtobufMessage>(
  methodDescriptor: grpc.MethodDefinition<Req, Res>,
  options: RpcOptions<Req, Res>,
  controlFunctions?: Partial<ControlFunctions<Res>>,
): GrpcSource<Res> {
  const dataSubject = new Subject<Res>();
  const controlMessageSubject = new Subject<GrpcControlMessage>();

  const allControlFunctions: ControlFunctions<Res> = {
    ...DEFAULT_CONTROL_FUNCTIONS,
    ...controlFunctions,
  };

  const rpcOptions: grpc.InvokeRpcOptions<Req, Res> = {
    ...options,
    onHeaders(headers) {
      allControlFunctions.onHeaders(controlMessageSubject, dataSubject, headers);
    },
    onMessage(response) {
      allControlFunctions.onMessage(controlMessageSubject, dataSubject, response);
    },
    onEnd(code, message) {
      allControlFunctions.onEnd(controlMessageSubject, dataSubject, code, message);
    },
  };

  grpc.invoke(methodDescriptor, rpcOptions);

  return {
    data: dataSubject.asObservable(),
    messages: controlMessageSubject.asObservable(),
  };
}

export * from './operators';
