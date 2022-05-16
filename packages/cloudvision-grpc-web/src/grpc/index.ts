import { grpc } from '@improbable-eng/grpc-web';
import type { GrpcControlMessage, GrpcEnd, GrpcInvoke, GrpcSource, RpcOptions } from '@types';
import { map, merge, Observable, Subject } from 'rxjs';

/**
 * RxJs wrapper around `grpc.invoke` that creates an Observable.
 * On subscription, the underlying `grpc.invoke` is called.
 * On unsubscription, the active request is closed.
 */
export function fromGrpcInvoke<Req extends grpc.ProtobufMessage, Res extends grpc.ProtobufMessage>(
  methodDescriptor: grpc.MethodDefinition<Req, Res>,
  options: RpcOptions<Req, Res>,
): Observable<GrpcInvoke<Res>> {
  return new Observable((subscriber) => {
    const headers$ = new Subject<grpc.Metadata>();
    const message$ = new Subject<Res>();
    const end$ = new Subject<GrpcEnd>();

    const rpcOptions: grpc.InvokeRpcOptions<Req, Res> = {
      ...options,
      onHeaders(headers) {
        headers$.next(headers);
      },
      onMessage(response) {
        message$.next(response);
      },
      onEnd(code, message, trailers) {
        end$.next({ code, message, trailers });

        end$.complete();
        headers$.complete();
        message$.complete();
        subscriber.complete();
      },
    };

    const request = grpc.invoke(methodDescriptor, rpcOptions);

    subscriber.next({
      headers$,
      message$,
      end$,
    });

    return () => {
      try {
        request.close();
      } catch (e) {
        // Do nothing for now
      }

      end$.complete();
      headers$.complete();
      message$.complete();
    };
  });
}

export function fromGrpcSource<Req extends grpc.ProtobufMessage, Res extends grpc.ProtobufMessage>(
  methodDescriptor: grpc.MethodDefinition<Req, Res>,
  options: RpcOptions<Req, Res>,
): Observable<GrpcSource<Res>> {
  return fromGrpcInvoke(methodDescriptor, options).pipe(
    // Merge `end$` and `headers$` into a single control message stream
    map(({ end$, headers$, message$ }): GrpcSource<Res> => {
      const controlMessage$ = merge(
        headers$.pipe(map((headers): GrpcControlMessage => ({ metadata: headers }))),
        end$.pipe(map((end): GrpcControlMessage => ({ error: end }))),
      );

      return {
        data$: message$,
        message$: controlMessage$,
      };
    }),
  );
}
