#!/bin/bash

cd commits-service

# Run npm install with legacy-peer-deps
npm i --legacy-peer-deps

# Run npm build
npm run build

cd ..

cd issues-service

# Run npm install with legacy-peer-deps
npm i --legacy-peer-deps

# Run npm build
npm run build

cd ..

cd pull-requests-service

# Run npm install with legacy-peer-deps
npm i --legacy-peer-deps

# Run npm build
npm run build

cd ..

cd repositories-service

# Run npm install with legacy-peer-deps
npm i --legacy-peer-deps

# Run npm build
npm run build

cd ..

cd scheduler-service

# Run npm install with legacy-peer-deps
npm i --legacy-peer-deps

# Run npm build
npm run build
