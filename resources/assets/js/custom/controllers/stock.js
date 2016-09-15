(function () {
    'use strict';

    StockController.$inject = [];

    /* @ngInject */
    function StockController() {
        var st = this;

        activate();
        ////////////////

        function activate() {

        }
    }
    
    angular
      .module('app')
      .controller('StockController', ['$scope', '$http', '$filter', function ($scope, $http, $filter) {
          $scope.stocks = [];

          $scope.addStock = function(){ 
              console.log("Category = " + $scope.icategory);
              
            var cCategory = $scope.icategory;
            var cItemname = $scope.iname;
            var cItemnumber = $scope.inumber;
            var cItemprice = $scope.iprice;
            var cDescription = $scope.idescription;
            
             $http.post('/api/stock', {
                'category': cCategory,
    			'itemname': cItemname,
    			'itemnumber': cItemnumber,
    			'price': cItemprice,
    			'description': cDescription
    		}).success(function(data, status, headers, config) {
    			$scope.stocks.push(data);
    			console.log("Temp = " +data);
    			$scope.stock = '';
    		});
    		
            
          }; 
          
        $scope.init = function() {
    		console.log("init");
    		$http.get('/api/stock').
        		success(function(data, status, headers, config) {
        			$scope.stocks = data;
        		});
	    };
	    
	    $scope.init();
          
          
        }]);
      
      

})();