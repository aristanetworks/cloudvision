import { grpc } from '@improbable-eng/grpc-web';
import { makeSubject, Subject } from 'wonka';

import { ControlFunctions, GrpcControlMessage, GrpcSource, RpcOptions } from '../../types';

const DEFAULT_CONTROL_FUNCTIONS = {
  onHeaders: <TResponse>(
    controlMessageSubject: Subject<GrpcControlMessage>,
    _dataSubject: Subject<TResponse>,
    headers: grpc.Metadata,
  ) => {
    controlMessageSubject.next({ metadata: headers });
  },
  onMessage: <TResponse>(
    _controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    response: TResponse,
  ) => {
    dataSubject.next(response);
  },
  onEnd: <TResponse>(
    controlMessageSubject: Subject<GrpcControlMessage>,
    dataSubject: Subject<TResponse>,
    code: grpc.Code,
    message: string,
  ) => {
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
 * [Sources](https://wonka.kitten.sh/api/sources) that can be subscribed to.
 */
export function fromGrpcInvoke<
  TRequest extends grpc.ProtobufMessage,
  TResponse extends grpc.ProtobufMessage
>(
  methodDescriptor: grpc.MethodDefinition<TRequest, TResponse>,
  options: RpcOptions<TRequest, TResponse>,
  controlFunctions: ControlFunctions<TResponse> = DEFAULT_CONTROL_FUNCTIONS,
): GrpcSource<TResponse> {
  const dataSubject = makeSubject<TResponse>();
  const controlMessageSubject = makeSubject<GrpcControlMessage>();

  const rpcOptions: grpc.InvokeRpcOptions<TRequest, TResponse> = {
    ...options,
    onHeaders: (headers: grpc.Metadata) => {
      controlFunctions.onHeaders(controlMessageSubject, dataSubject, headers);
    },
    onMessage: (response: TResponse) => {
      controlFunctions.onMessage(controlMessageSubject, dataSubject, response);
    },
    onEnd: (code: grpc.Code, message: string) => {
      controlFunctions.onEnd(controlMessageSubject, dataSubject, code, message);
    },
  };

  grpc.invoke(methodDescriptor, rpcOptions);

  return {
    data: dataSubject.source,
    messages: controlMessageSubject.source,
  };
}

export * from './utils';
