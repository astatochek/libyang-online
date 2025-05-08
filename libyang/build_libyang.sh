#!/bin/bash
set -e # Exit immediately on error

# 1. Setup Emscripten
if [ ! -d "emsdk" ]; then
  echo "Cloning emsdk..."
  git clone https://github.com/emscripten-core/emsdk.git
else
  echo "emsdk already exists, skipping clone"
fi
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..

# 2. Build PCRE2
if [ ! -d "pcre2-10-42" ]; then
  echo "Downloading PCRE2..."
  wget https://github.com/PCRE2Project/pcre2/releases/download/pcre2-10.42/pcre2-10.42.tar.gz
  tar xvf pcre2-10.42.tar.gz
  rm pcre2-10.42.tar.gz
else
  echo "PCRE2 elready exists, skipping download"
fi
cd pcre2-10.42
if [ ! -d "build" ]; then
  mkdir build
fi
cd build
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DPCRE2_BUILD_PCRE2_8=ON \
  -DPCRE2_SUPPORT_UNICODE=ON \
  -DCMAKE_INSTALL_PREFIX=$(pwd)/../../pcre2-install
emmake make install
cd ../..

# 3. Build libyang with absolute paths
if [ ! -d "libyang" ]; then
  echo "Cloning libyang..."
  git clone https://github.com/CESNET/libyang.git
else
  echo "libyang already exists, skipping clone"
fi

cd libyang

if [ ! -d "build" ]; then
  mkdir -p build
fi

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
  -O3 -o ../public/wasm/validator.js
