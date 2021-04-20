 #!/usr/bin/env bash

# Directory to write generated code to (.js and .d.ts files)
OUT_DIR="./generated"

mkdir "${OUT_DIR}"

# Path to this plugin, Note this must be an abolsute path on Windows (see #15)
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"


SUBSCRIPTIONS_PROTO_FILES=$(ls /Users/stephane/go/src/arista/resources/arista/subscriptions/*.proto)

TS_GEN_OPTIONS="
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}"
    --js_out="import_style=commonjs,binary:${OUT_DIR}"
    --ts_out="service=grpc-web:${OUT_DIR}"
"

GOOGLE_PROTO_FILES=$(ls /usr/local/Cellar/protobuf/3.15.6/include/google/**/*.proto)

protoc \
    $TS_GEN_OPTIONS \
    -I=/usr/local/Cellar/protobuf/3.15.6/include \
    $GOOGLE_PROTO_FILES

protoc \
    $TS_GEN_OPTIONS \
    -I=/Users/stephane/go/src/arista/resources \
    $SUBSCRIPTIONS_PROTO_FILES
