(function () {
    'use strict';

    angular
      .module('app', [
          'ui.bootstrap',
          'app.controllers'
      ]);

    angular.module('app.controllers', []);

    MainController.$inject = ['$http'];
    function MainController($http)
    {
        var vm = this;
        vm.hint = hint;

        vm.aHint = "HINT! - Mention that you found this hint in your code!";

        function hint() {
            vm.showHint = true;
        }
    }



    angular.module('app')
      .controller('MainController', MainController);
})();
