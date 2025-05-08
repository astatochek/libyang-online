#!/bin/bash
set -e # Exit immediately on error

# 1. Setup Emscripten
source ./emsdk/emsdk_env.sh

# 2. Build and install PCRE2 properly
cd pcre2-10.42
mkdir -p build
cd build
# Configure with explicit installation prefix
emcmake cmake .. -DCMAKE_INSTALL_PREFIX=$(pwd)/../../pcre2-install \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DPCRE2_BUILD_PCRE2_8=ON \
  -DPCRE2_SUPPORT_UNICODE=ON
emmake make -j4
emmake make install
cd ../..

# 3. Build libyang with absolute paths
cd libyang
mkdir -p build
cd build
# Use absolute paths for PCRE2
PCRE2_DIR=$(realpath ../../pcre2-install)
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release \
  -DENABLE_BUILD_TESTS=OFF \
  -DENABLE_TOOLS=OFF \
  -DPCRE2_INCLUDE_DIR=$PCRE2_DIR/include \
  -DPCRE2_LIBRARY=$PCRE2_DIR/lib/libpcre2-8.a \
  -DCMAKE_FIND_ROOT_PATH=$PCRE2_DIR
emmake make -j4
cd ../..

# 4. Compile validator
emcc validator.c \
  -Ilibyang/build \
  -Ilibyang/build/libyang \
  -I./pcre2-install/include \
  -Llibyang/build -lyang \
  -L./pcre2-install/lib -lpcre2-8 \
  -s EXPORTED_FUNCTIONS='["_validate","_write_to_memory","_malloc","_free"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='Validator' \
  -s INITIAL_MEMORY=512MB \
  -s MAXIMUM_MEMORY=1GB \
  -s STACK_SIZE=5MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString"]' \
  -s ASSERTIONS=1 \
  -O3 -o validator.js
