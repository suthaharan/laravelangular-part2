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
          
    	  $scope.tempstores = [];

          $scope.addConversion = function(){ 
             // console.log("Factor = " + $scope.factor);
             // console.log("Temp = " + $scope.temp);
            var cFactor = $scope.factor;
            var cValue = $scope.temp;
            var cCelcius = 0;
            var cFahrenheit = 0;
            var cConvertedvalue = 0;
            
            if(cFactor == 'F'){
                cConvertedvalue = $filter('formatTemperature')(cValue, cFactor, true);
                cFahrenheit = cValue;
                cCelcius = cConvertedvalue;
            }else{
                cConvertedvalue = $filter('formatTemperature')(cValue, cFactor);
                cCelcius = cValue+'\u00B0';
                cFahrenheit = cConvertedvalue;
            }

            
            $scope.convertedtemp = cConvertedvalue;
            
            $http.post('/api/tempstore', {
                'factor': cFactor,
    			'celcius': cCelcius,
    			'fahrenheit': cFahrenheit,
    			'convertedval': cConvertedvalue
    		}).success(function(data, status, headers, config) {
    			$scope.tempstores.push(data);
    			// console.log("Temp = " +data);
    			$scope.tempstore = '';
    		});
          };
          
 	    $scope.deleteTempstore = function(index) {
    		var tempstore = $scope.tempstores[index];
    		$http.delete('/api/tempstore/' + tempstore.id)
    			.success(function() {
    				$scope.tempstores.splice(index, 1);
    			});;
	    };         
          
        $scope.init = function() {
    		console.log("init");
    		$http.get('/api/tempstore').
        		success(function(data, status, headers, config) {
        			$scope.tempstores = data;
        		});
	    };
	    
	    $scope.init();
          
          
        }]);
      
     

})();