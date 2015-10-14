// Setup basic express server
var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var authentication = require('./routes/authentication');

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use("/", express.static(path.join(__dirname, '/public')));
app.use("/node_modules/socket.io-client", express.static(path.join(__dirname, '/node_modules/socket.io-client')));
app.use("/loginUrl", authentication);

var messages = [];
var usernames = {};
var numUsers = 0;
io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('new message', function (message) {
        var msg = {date: new Date().toLocaleTimeString(),
                    sender: socket.username,
            message: message};
        messages.push(msg);
        io.emit('new message', {
            username: socket.username,
            message: msg
        });
    });

    socket.on('add user', function (username) {
        socket.username = username;
        usernames[username] = username;
        ++numUsers;
        addedUser = true;

        socket.emit('login', {
            numUsers: numUsers,
            log: messages
        });

        io.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            source: socket.username
        });
    });

    socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing');
    });

    socket.on('disconnect', function () {
        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});
