#!/bin/bash

set -a
source .env
set +a

python ./app/initial_data.py
