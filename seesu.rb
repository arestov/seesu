require 'rubygems'
require 'sinatra'
require 'json'
require 'dm-core'
require 'do_sqlite3'

set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :views, 'views'

mime :json, 'appliaction/json'

DataMapper.setup :default, ENV['DATABASE_URL'] || 'sqlite3://my.db'

class UsageInfo
  include DataMapper::Resource

  property :id,          Integer, :serial => true
  property :hash,        String
  property :version,     String
  property :agent,       String
  property :referer,     String
  property :accept,      String
  property :ip,          String
  property :when,        DateTime
  property :demension_x, Integer
  property :demension_y, Integer  
  
  auto_upgrade!
end

DataMapper.auto_upgrade!

get '/' do
  "Hi, I'm Seesu server. Nice to meet you!"
end

post '/update' do
 
  inviters = {

    :yodapunk => {
      :count  => 0,
      :link   => 'http://vk.com/reg198193',
      :select => true
    },
    
    :kossnocorp => {
      :count  => 0,
      :link   => 'http://vk.com/reg37829378',
      :select => true
    }, 
    
    :porqz => {
      :count  => 0,
      :link   => 'http://vk.com/reg668467',
      :select => true
    },
    
    :elv1s => {
      :count  => 0,
      :link   => 'http://vk.com/reg1114384',
      :select => true
    }    
  }
  
  referer = :yodapunk
  
  info = UsageInfo.new (
    :hash => params[:hash],
    :version => params[:version],

    :agent => user_agent,
    :referer => referer.to_s,
    :accept => accept,
    
    :ip => @env['REMOTE_ADDR'],
    
    :when => Time.now,
    :demension_x => params[:demension_x],
    :demension_y => params[:demension_y]
  )
  
  info.save

  content_type :json
  
  {
    :latest_version => {
      :number   => '0.1',
      :link     => '#'
    }, 
    
    :vk_referer => inviters[referer][:link],
    
    :promo => {
      :text     => '',
      :lang     => '',
      :number   => 0,
      :until    => Time.now
    }
  }.to_json
end

get '/log' do
  log_html = '<table><tr>' +
             '<td>hash</td>' +
             '<td>version</td>' +
             '<td>width</td>' +
             '<td>heigth</td>' +
             
             '<td>agent</td>' +
             '<td>referer</td>' +
             '<td>accept</td>' +
             '<td>ip</td>' +
             
             '<td>when</td></tr>'

  UsageInfo.all.each do |usage_info|
    
    log_html += 
      "<tr><td>#{usage_info.hash}</td><td>#{usage_info.version}</td>"+
      "<td>#{usage_info.demension_x}</td><td>#{usage_info.demension_y}</td>" +
      "<td>#{usage_info.agent}</td><td>#{usage_info.referer}</td>" +
      "<td>#{usage_info.accept}</td><td>#{usage_info.ip}</td>" +
      "<td>#{usage_info.when}</td></tr>"
  
  end
  
  log_html += '</table>'
  log_html
end

get '/debug' do
  @env.inspect
end
