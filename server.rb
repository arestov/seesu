require 'socket'

puts 'Starting server'
server = TCPServer.new '127.0.0.1', 3456
puts '...Ok!'

while session = server.accept
  session.print "HTTP/1.1 200/OK\r\nContent-type:text/html\r\n\r\n"
  begin
    filename = session.gets.gsub(/GET\ \//, '').gsub(/\ HTTP.*/, '').chomp
    puts "Rendering \"#{filename}\""
  
    session.print File.open(filename, 'r').read
    puts '...Ok!'
  rescue Errno::ENOENT
    session.print '404'
    puts "...Error :( Can't find \"#{filename}\""
  rescue Errno::ECONNRESET, Errno::EPIPE
    puts "I'm out of breath... Easy men!"
    sleep 5
    puts 'Continue listen'
  end
  session.close
end
