# cloudvision-grpc-web

A grpc-web client for requesting CloudVision data from the frontend. This libraries exposed
functions and utils that convert the grpc-web calls to Observable streams that can be manipulated
using [Wonka](https://wonka.kitten.sh/).

## Installation

```bash
npm install cloudvision-grpc-web
```

or

```bash
yarn install cloudvision-grpc-web
```

## Usage

```js
import { fromResourceGrpcInvoke } from 'cloudvision-grpc-web';
import { pipe, subscribe } from 'wonka';

import { DeviceService } from '../generated/arista/inventory.v1/services.gen_pb_service';
import { DeviceStreamRequest } from '../generated/arista/inventory.v1/services.gen_pb';

const requestAllMessage = new DeviceStreamRequest();

const grpcRequest = fromResourceGrpcInvoke(DeviceService.Subscribe, {
  host: 'http://cvphost',
  request: requestAllMessage,
});

// Will print out each data message as it arrives
pipe(
  grpcRequest.data,
  subscribe((val) => console.log('data', val.toObject())),
);

// Will print out any Grpc metadata or errors as they happen
pipe(
  grpcRequest.messages,
  subscribe((val) => console.log('control message', val.toObject())),
);
```
