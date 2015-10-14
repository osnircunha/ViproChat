/**
 * Created by osnircunha on 10/8/15.
 */
var app = angular.module('viproChat', ['ui.router', 'ngAnimate', 'btford.socket-io']);

app.config(function ($stateProvider, $urlRouterProvider) {
// For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/welcome");

    $stateProvider
        .state('welcome', {
            url: "/welcome",
            templateUrl: "html/home.html",
            controller: function ($rootScope, $scope, $state) {
                $scope.submit = function(){
                    $rootScope.nickname = $scope.nickname;
                    $state.go('chat');
                }
            },
            data: {
                requireLogin: false
            }
        })
        .state('chat', {
            url: "/chat",
            templateUrl: "html/chat.html",
            controller: "messageController",
            data: {
                requireLogin: true
            }
        });
});