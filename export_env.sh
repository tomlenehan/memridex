#!/bin/bash

set -a
source .env
set +a

python ./backend/app/initial_data.py
