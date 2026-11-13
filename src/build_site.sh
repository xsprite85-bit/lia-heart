#!/bin/bash
# Build the GitHub Pages site into ../lia-heart (repo) and the single-file version for claude.ai.
#   ./build_site.sh            only puts in the clips that already exist
#   GK=... ./build_site.sh rec records the missing clips first (Gemini key only as an environment variable)
set -e
cd "$(dirname "$0")"; REPO=../lia-heart
python3 assemble.py ./lib/three site.html
python3 assemble.py https://cdn.jsdelivr.net/npm/three@0.170.0 lia-heart.html
MAX=0; [ "$1" = rec ] && MAX=99
python3 voice/heart_voice.py site.html --site $REPO --max-requests $MAX | tail -c 400; echo
python3 voice/heart_voice.py lia-heart.html --max-requests 0 >/dev/null
# three.js (served from the same site — no outside requests)
T=node_modules/three; L=$REPO/lib/three
for f in build/three.module.js examples/jsm/controls/OrbitControls.js examples/jsm/loaders/GLTFLoader.js examples/jsm/utils/BufferGeometryUtils.js \
         examples/jsm/libs/meshopt_decoder.module.js examples/jsm/environments/RoomEnvironment.js; do mkdir -p $L/$(dirname $f); cp $T/$f $L/$f; done
cp $T/LICENSE $L/LICENSE
# sources + clip timing files
mkdir -p $REPO/src/fonts $REPO/voice/clips
cp template.html kids.js i18n_src.py assemble.py build.py anchors.py fist.js alveoli.js heart_mo.glb heartdata.json logo.svg logo-maskable.svg render_icons.py build_site.sh $REPO/src/
cp fonts/* $REPO/src/fonts/; cp voice/heart_voice.py $REPO/voice/; cp voice/clips/*.json $REPO/voice/clips/
cp privacy.html manifest.webmanifest sw.js README.md $REPO/
cp -r icons $REPO/
ls $REPO/v | wc -l
