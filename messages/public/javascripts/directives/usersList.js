/**
 * Created by osnircunha on 10/12/15.
 */

app.directive("usersList", function () {
    return {
        restrict: 'E',
        template: "<span>{{userCount}} on chat</span>",
        controller: function($scope, chatSocket, $rootScope){

            $scope.$on('socket:user joined', function(event, data) {
                $scope.userCount = data.numUsers;
            });

            $scope.$on('socket:user left', function(event, data){
                $scope.userCount = data.numUsers;
            });
        }
    }
})