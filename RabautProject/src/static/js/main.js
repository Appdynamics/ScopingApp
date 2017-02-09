'use strict';

var app = angular.module('ScopingApp', ['ngRoute']);



app.config(function($interpolateProvider, $httpProvider){
        $interpolateProvider.startSymbol('[[').endSymbol(']]');
  });


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    // Home
    .when("/", {templateUrl: "/static/partials/home.html", controller: "PageCtrl"})
    // Pages
    .when("/povapp", {templateUrl: "/static/partials/povadd.html", controller: "PageCtrl"})
    .when("/update", {templateUrl: "/static/partials/update.html", controller: "PageCtrl"})
    .otherwise("/404", {templateUrl: "/static/partials/404.html", controller: "PageCtrl"});
}]);

/**
 * Controls the Blog
 */
app.controller('PageCtrl', function ($scope, $location, $http) {
  console.log("POV Controller reporting for duty.");

    $scope.info = {};

    $scope.showAdd = true;

    $scope.selectedProducts = [];

    $scope.showlist = function() {
       $http({
           method: 'GET',
           url: '/getPovs'
       }).then(function(response) {
           $scope.povs = response.data;
           console.log('mm', $scope.povs);
       }, function(error) {
           console.log(error);
       });
   }
   //In this function take out the call to show list, and on succesful add,
   //hide modal and open PovAppAdd modal
    $scope.addPov = function() {

           $http({
               method: 'POST',
               url: '/add',
               data: {
                   info: $scope.info
               }
           }).then(function(response) {
               $scope.showlist();
               $('#addPopUp').modal('hide')
               $('#addApp').modal('show')
               $scope.showApp = true;
               $scope.info = {}
           }, function(error) {
               console.log(error);
           });
       }

    $scope.addApp = function() {

    }


    $scope.editMachine = function(id){
   				$scope.info.id = id;

   				$scope.showAdd = false;

   				$http({
   						method: 'POST',
   						url: '/getPov',
   						data: {id:$scope.info.id}
   				}).then(function(response) {
   						console.log(response);
   						$scope.info = response.data;
   						$('#addPopUp').modal('show')
   					}, function(error) {
   						console.log(error);
   					});
   			}


    $scope.updatePov = function(id){

   					$http({
   						method: 'POST',
   						url: '/update',
   						data: {
                info:$scope.info
              }
   					}).then(function(response) {
   						console.log(response.data);
   						$scope.showlist();
   						$('#addPopUp').modal('hide')
   					}, function(error) {
   						console.log(error);
   					});
   				}

    $scope.confirmDelete = function(id){
      $scope.deletePovId = id;
      $('#deleteConfirm').modal('show');
    }

    $scope.deleteMachine = function(){


          $http({
						method: 'POST',
						url: '/delete',
						data: {
              id:$scope.deletePovId
            }
					}).then(function(response) {
						console.log(response.data);
						$scope.deletePovId = '';
						$scope.showlist();
						$('#deleteConfirm').modal('hide')
					}, function(error) {
						console.log(error);
					});
				}

    $scope.showAddPopUp = function(){
   				$scope.showAdd = true;
   				$scope.info = {};
          console.log($scope)
   				$('#addPopUp').modal('show')
   		 }

    $scope.showProducts = function(){
          $scope.products = [];
          $http({
            method: 'GET',
            url: '/getProducts'
          }).then(function(response) {
              $scope.products = response.data;
              console.log('mm', $scope.products);
          }, function(error) {
              console.log(error);
          });
      }


    $scope.showlist();
    $scope.showProducts();

});

app.controller("contactForm", ['$scope', '$http', function($scope, $http) {
    $scope.success = false;
    $scope.error = false;

    $scope.sendMessage = function( input ) {
      input.submit = true;
      $http({
          method: 'POST',
          url: '/partials/contact.php',
          data: input,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .success( function(data) {
        if ( data.success ) {
          $scope.success = true;
          $scope.input = {};
          $scope.form.$setPristine();
        } else {
          $scope.error = true;
        }
      } );
    }
  }]);
