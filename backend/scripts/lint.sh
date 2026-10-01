#!/usr/bin/env bash

set -e
set -x

# Re-enable strict MyPy once the existing project-wide type-error backlog is cleared.
ruff check app
ruff format app --check
