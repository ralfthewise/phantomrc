phantomrc
=========

PhantomJS Remote Control

mkdir -p /tmp/phantomrc && rm -f /tmp/phantomrc/*
phantomjs harness.js &
bundle exec rackup config.ru -s thin -E production &

#download noVNC and in that directory run:
./utils/launch.sh --vnc localhost:5900

#checkout git@github.com:ralfthewise/phantomvnc.gi, build it according to the README, and then run:
./src/phantomvnc /tmp/phantomrc

#then visit http://localhost:9292/test/index.html
