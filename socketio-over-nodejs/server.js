// https://www.webrtc-experiment.com/

var fs = require('fs');

// SSL 인증서 (임시)
var options = {
    key: fs.readFileSync('fake-keys/key/privatekey.pem'),
    cert: fs.readFileSync('fake-keys/certificate.pem')
};

// var options = {
//     key: fs.readFileSync('fake-keys/key/private.key'),
//     cert: fs.readFileSync('fake-keys/key/private.crt')
// };

// HTTPs server
var app = require('https').createServer(options, function(request, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    response.end();
});


// socket.io goes below
var io = require('socket.io').listen(app, {
    log: true,
    // origins: '*:*'
});

io.set('transports', [
    // 'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

var channels = {};
var broadcasterid = null;
/* 
    TODO: 
        * admin소켓 저장하여야함. 리스너 만들것
        * 캐티에서 응답받은 response를 tomcat으로 post해야함.
*/

// io.sockets.on 내부에서 socket 핸들링할것.
io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel) {
            delete channels[initiatorChannel];
        }
    });

    

});

// 채널명으로 namespace 관리
function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }
        
        socket.on('message', function (data) {
            if (data.sender == sender) {
                if(!username) username = data.data.sender;
                if(!broadcasterid) broadcasterid = data.data.broadcaster;
                socket.broadcast.emit('message', data.data);
            }
        });
        
        socket.on('disconnect', function() {
            if(username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}

// run app

app.listen(9559);

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

// console.log('Please open SSL URL: https://192.168.219.172:'+(9559)+'/');
console.log('Please open SSL URL: https://13.125.108.32:'+(9559)+'/');
