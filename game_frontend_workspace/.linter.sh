#!/bin/bash
cd /home/kavia/workspace/code-generation/tictacweb-55838-75edde25/game_frontend_workspace/game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

