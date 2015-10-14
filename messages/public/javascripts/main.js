app.factory('chatSocket', function (socketFactory) {
        var socket = socketFactory();
        socket.forward(['login', 'typing', 'stop typing', 'user left', 'user joined', 'new message']);
        return socket;
    });
app.controller('messageController', function ($scope, $rootScope, $log, chatSocket, $state) {

    if(!$rootScope.nickname){
        $state.go('welcome');
    } else {
        chatSocket.emit("add user", $rootScope.nickname);
    }

    $scope.message = '';
    $rootScope.connected = false;
    var typing = false;
    var TYPING_TIMER_LENGTH = 1000; // ms
    var lastTypingTime;

    // Send events
    $scope.sendMessage = function() {
        chatSocket.emit('new message', $scope.message);
        $scope.message = '';
    };

    $scope.writing = function () {
        chatSocket.emit('typing', $rootScope.nickname);
    }


    // Listen events
    $scope.$on('socket:new message', function (event, data) {
        if (!data.message) {
            $log.error('invalid message', 'event', event, 'data', JSON.stringify(data));
            return;
        }
        $scope.$apply(function() {
            appendMessage(data.message);
        });
    });

    $scope.$on('socket:login', function (event, data) {
        $rootScope.connected = true;
        $scope.$apply(function() {
            log = data.log.slice(data.log.length > 10 ? data.log.length - 10 : 0, data.log.length);
            for (var i = 0; i < log.length; i++) {
                appendMessage(log[i]);
            }
        });
    });

    $scope.$on('socket:user joined', function (event, data) {
        var message = "[user joined] there are " + data.numUsers + " participants";
        console.log(message);
    });

    $scope.$on('socket:user left', function(event, data){
        console.log(data.username + ' left');
    });

    $scope.$on('socket:typing', function(event, user) {
        angular.element(".typing").append('<span class="user">' + user.source + ' is typing...' + '</span>');
    });

    $scope.$on('socket:stop typing', function() {
        angular.element(".user").fadeOut(function () {
            angular.element(this).remove();
        });
    });

    function appendMessage(message){
        angular.element(".messages").append(createMessageTag(message.sender, message.message, message.date));
        angular.element(".messages")[0].scrollTop = angular.element(".messages")[0].scrollHeight;
    }

    // Updates the typing event
    function updateTyping () {
        if ($rootScope.connected) {
            if (!typing) {
                typing = true;
                chatSocket.emit('typing', $rootScope.nickname);
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    chatSocket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    var inputMessageElement = angular.element('.inputMessage');
    var windowElement = angular.element(window);
    // JQuery calls
    inputMessageElement.on('input', function() {
        updateTyping();
    });

    // Focus input when clicking anywhere on login page
    windowElement.click(function () {
        inputMessageElement.focus();
    });

    // Focus input when clicking on the message input's border
    inputMessageElement.click(function () {
        inputMessageElement.focus();
    });

    windowElement.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            inputMessageElement.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if ($rootScope.nickname) {
                chatSocket.emit('stop typing');
                typing = false;
            }
        }
    });

    function createMessageTag(sender, message, time){
        var boxType = sender == $rootScope.nickname ? 'right' : 'left';
        var template = '<li><div class="msg-box triangle-isosceles ' + boxType + '"><span class="msg-title">{0}</span><span class="msg-body">{1}</span><span class="msg-time text-muted">{2}</span></div></li>';
        return replaceToken([sender, message, time], template);
    };

    function replaceToken(stringArray, text){
        return text.replace(/\{(\d+)\}/g, function(match, contents, offset, totalString) {
            return stringArray[contents];
        });
    };
});