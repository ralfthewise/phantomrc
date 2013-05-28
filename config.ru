$faye_env = ENV['FAYE_ENV'] || 'development'
$faye_port = ENV['FAYE_PORT'] || 9292
$stdout.sync = true if $faye_env == 'development'
$app_root = File.expand_path('..', __FILE__)
$LOAD_PATH.unshift $app_root

require 'faye'
Faye::WebSocket.load_adapter('thin')

#setup logging
require 'logger'
require 'multi_delegator'
Faye::Logging.log_level = ($faye_env == 'development' ? :info : :error)
file = File.open('faye.log','a')
file.sync = true
faye_logger = Logger.new(file)
Faye.logger = lambda { |m| faye_logger.info(m) }

#serve up test page at /test/index.html
map '/test' do
  run Rack::File.new($app_root)
end

#run it
app = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)
run app

#require 'sinatra'
#misc settings
#use Rack::MethodOverride #this allows you to to do non-POST requests but include query parameter "_method" and Rack will treat is as a POST
#disable :run #don't run the internal Sinatra webserver in any situations (normally it will run the webserver if you start the app with 'ruby my_app.rb')
#disable :reload #don't reload code in any environments

#LATER, look at memcache session store
#key needs to match the one in rails at config/initializers/secret_token.rb
#use Rack::Session::Cookie, key: 'c2ec61ad4a9be2a22e3a47bab06f0f3caec61909c13c78fa7b4904dcf472dc925045f7d10e0e48773fdb2ffb1665541c63e2795a468a6d644fe1d1022dcea9e8'

#use Faye::RackAdapter, mount: '/faye', timeout: 25
#run Sinatra::Application
