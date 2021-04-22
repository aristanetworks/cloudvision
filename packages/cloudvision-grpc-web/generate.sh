 #!/usr/bin/env bash


if [ -z "$1" ]
  then
    echo "No Go source location supplied. Please enter the location where your go files live."
    exit 1
fi

if [ -z "$2" ]
  then
    echo "No proto source location supplied. Please enter the location where the protobuf libraries are installed."
    exit 1
fi


GO_SRC_LOC="$1"
PROTO_LOC="$2"

# Directory to write generated code to (.js and .d.ts files)
OUT_DIR="./generated"

mkdir "${OUT_DIR}"

# Path to this plugin, Note this must be an absolute path on Windows
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"


SUBSCRIPTIONS_PROTO_FILES=$(ls $GO_SRC_LOC/arista/resources/arista/subscriptions/*.proto)

TS_GEN_OPTIONS="
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}"
    --js_out="import_style=commonjs,binary:${OUT_DIR}"
    --ts_out="service=grpc-web:${OUT_DIR}"
"

GOOGLE_PROTO_FILES=$(ls $PROTO_LOC/include/google/**/*.proto)

protoc \
    $TS_GEN_OPTIONS \
    -I=$PROTO_LOC/include \
    $GOOGLE_PROTO_FILES

protoc \
    $TS_GEN_OPTIONS \
    -I=$GO_SRC_LOC/arista/resources \
    $SUBSCRIPTIONS_PROTO_FILES
