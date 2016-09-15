(function () {
    'use strict';

    var degreesSymbol = '\u00B0';

    function convertCelsiusToFahrenheit(value) {
        return Math.round(value * 9.0 / 5.0 + 32);
    }

    function convertFahrenheitToCelsius(value) {
        return Math.round((value - 32) * 5.0 / 9.0);
    }

    function addDegreesSymbol(value) {
        return value += degreesSymbol;
    }

    function formatTemperatureFilter() {
        return function (input, scale, label) {
            var value = parseInt(input, 10),
                convertedValue;

            if (isNaN(value)) throw new Error('Input is not a number');

            if (scale === 'F') {
                convertedValue = convertCelsiusToFahrenheit(value);
            } else if (scale === 'C') {
                convertedValue = convertFahrenheitToCelsius(value);
            } else {
                throw new Error('Not a valid scale');
            }

            return label ? addDegreesSymbol(convertedValue) : convertedValue;
        };
    }
    
    
    
    
    TemperatureController.$inject = [];

    /* @ngInject */
    function TemperatureController() {
        var tc = this;

        activate();
        ////////////////

        function activate() {

        }
    }
    
    angular
      .module('app')
      .filter('formatTemperature', formatTemperatureFilter)
      .controller('TemperatureController', ['$scope', '$http', '$filter', function ($scope, $http, $filter) {
          

          $scope.addConversion = function(){ 
              console.log("Factor = " + $scope.factor);
              console.log("Temp = " + $scope.temp);
            var cFactor = $scope.factor;
            var cValue = $scope.temp;
            $scope.convertedtemp = $filter('formatTemperature')(cValue, cFactor, true);
          };          
          
          
        }]);
      
      

})();