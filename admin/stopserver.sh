#!/bin/bash

pkill -TERM -P `cat pwi.pid`
kill `cat pwi.pid`
