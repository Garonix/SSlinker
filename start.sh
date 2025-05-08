#!/bin/bash

/usr/sbin/nginx -g "daemon off;" &
# exec service nginx start
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000