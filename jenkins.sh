#!/bin/bash
set -e

npm install
npm test

VERSION_PACKAGE=`python -c 'import json; f=json.loads(open("package.json").read()); print f["version"]'`
VERSION_REGISTRY=`npm view performanceplatform-client.js version`

if [ "$VERSION_LATEST" != "$VERSION_REGISTRY" ]; then
  npm publish
else
  echo 'Published version is up-to-date'
fi
