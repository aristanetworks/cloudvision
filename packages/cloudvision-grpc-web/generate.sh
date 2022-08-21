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

mkdir -p "${OUT_DIR}"

# Path to this plugin, Note this must be an absolute path on Windows
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts_proto"


SUBSCRIPTIONS_PROTO_FILES=$(ls $GO_SRC_LOC/arista/resources/arista/subscriptions/*.proto)

TS_GEN_OPTIONS="
    --plugin=${PROTOC_GEN_TS_PATH}
    --ts_proto_out=${OUT_DIR}/
    --ts_proto_opt=env=browser
    --ts_proto_opt=esModuleInterop=true
    --ts_proto_opt=outputClientImpl=grpc-web
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

echo "Use @arista/protobufjs"
find ${OUT_DIR} -type f -name "*.ts" -print0 | xargs -0 sed -i '' -e "s#protobufjs/minimal#@arista/protobufjs/minimal#g"

echo "Don't type-check generated files"
find ${OUT_DIR} -type f -name "*.ts" -print0 | xargs -0 sed -i '' -e "1s#^#/* eslint-disable @typescript-eslint/ban-ts-comment */\n// @ts-nocheck\n#"
