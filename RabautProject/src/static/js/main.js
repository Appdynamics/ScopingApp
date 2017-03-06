'use strict';

var app = angular.module('ScopingApp', ['ngRoute', 'ui.bootstrap', 'ngMaterial']);



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
    .when("/povapp", {templateUrl: "/static/partials/povapp.html", controller: "DetailCtrl"})
    .when("/admin", {templateUrl: "/static/partials/adminPortal.html", controller: "PageCtrl"})
    .when("/update", {templateUrl: "/static/partials/update.html", controller: "PageCtrl"})
    .otherwise("/404", {templateUrl: "/static/partials/404.html", controller: "PageCtrl"});
}]);


/**
 * Service to get POV/APP Details
 */
 app.service('productService', function($http) {

   var currentId;

   this.setId = function(id){
     this.currentId = id;
   };

   this.getId = function() {
     return this.currentId;
   };


   this.getPovs = function(povid) {

    return $http({
             method: 'POST',
             url: '/getPov',
             data: {
                 id: povid
             }
         }).then(function(response) {
             console.log(response.data)
             return response.data;
           }, function(error) {
             console.log(error);
             return error
           });

   };

   this.getApps = function(appid) {

    return $http({
               method: 'POST',
               url: '/getApps',
               data: {id: appid}
           }).then(function(response) {
               console.log(response.data)
               return response.data;
             }, function(error) {
                 console.log(error);
                 return error
             });
   };

 });

/**
 * Controls the Pages
 */
app.controller('PageCtrl', function ($scope, $location, $http, productService) {
  console.log("POV Controller reporting for duty.");

    $scope.info = {};
    $scope.selectedProducts = {};
    $scope.povid = null;
    $scope.selectedPov = null;
    $scope.showAdd = true;
    $scope.email = null;
    $scope.users = {};

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[3];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
      opened: false
    };

    $scope.dateOptions = {
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(2010,1,1),
    startingDay: 1
    };

    $scope.today = function() {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function() {
      $scope.dt = null;
    };

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.popup1 = {
      opened: false
    };

    $scope.open2 = function() {
      $scope.popup2.opened = true;
    };

    $scope.popup2 = {
      opened: false
    };

    $scope.showlist = function() {
       $http({
           method: 'GET',
           url: '/getPovs'
       }).then(function(response) {
           $scope.povs = response.data;
           //console.log('mm', $scope.povs);
       }, function(error) {
           console.log(error);
       });
   }

   $scope.showUser = function() {
     $http({
         method: 'GET',
         url: '/getUser'
     }).then(function(response) {
         $scope.users = response.data;
         $scope.email = {
           'info' : $scope.users[0].user
         }
         //console.log('mm', $scope.povs);
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
             //console.log('mm', $scope.products);
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
                   info: $scope.info,
                   email: $scope.email
               }
           }).then(function(response) {
               $scope.showlist();
               $('#addPopUp').modal('hide')
               $('#addApp').modal('show')
               $scope.povid = response.data.id
               $scope.showApp = true;
               $scope.info = {}
           }, function(error) {
               console.log(error);
           });
       }

    $scope.addApp = function() {

        //var lastpov = $scope.povs[$scope.povs.length - 1];
        //var lastid = lastpov['id'];
        var lastid = $scope.povid
        $http({
            method: 'POST',
            url: '/addApp',
            data: {
                info: $scope.info,
                id: lastid,
                products: $scope.selectedProducts
            }
        }).then(function(response) {
            console.log(response);
            $('#addApp').modal('hide')
            $scope.info = {}
            $scope.selectedProducts = {}
            $scope.editPov(lastid)
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        }, function(error) {
            console.log(error);
        });
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

    $scope.editPov = function(id) {
        $scope.info.id = id;
        productService.setId(id);

        $location.path('povapp')

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
    $scope.showlist();
    $scope.showProducts();
    $scope.showUser();
});

app.controller("DetailCtrl", ['$scope', '$http', '$location', 'productService', function($scope, $http, $location, productService) {
  console.log("DetailCtrl Controller reporting for duty.");

    $scope.info = {};
    $scope.javaModal = null;
    $scope.selectedProducts = {};
    $scope.page = productService.getId();

    productService.getPovs($scope.page).then(function(response) {
      $scope.povdetails = response;
    });


    productService.getApps($scope.page).then(function(response) {
      $scope.apps = response;
    });




    $scope.showProducts = function(){
          $scope.products = [];
          $http({
            method: 'GET',
            url: '/getProducts'
          }).then(function(response) {
              $scope.products = response.data;
              //console.log('mm', $scope.products);
          }, function(error) {
              console.log(error);
          });
      }

    $scope.addAppAgain = function(){
      $('#addApp').modal('show')
    }

    $scope.submitApp = function() {
      $http({
          method: 'POST',
          url: '/addApp',
          data: {
              info: $scope.info,
              id: $scope.page,
              products: $scope.selectedProducts
          }
      }).then(function(response) {
          console.log(response);
          $('#addApp').modal('hide')
          $scope.info = {}
          $scope.selectedProducts = {}
          productService.getApps($scope.page).then(function(response) {
            $scope.apps = response;
          });
          //$location.path('povapp')
      }, function(error) {
          console.log(error);
      });
    }

    //THIS ACTUALLY WORKS
    $scope.showModals = function(name) {
        $scope.javaModal = name[0]

        if ($scope.javaModal=="Java APM") {

          $('#javaModal').modal('show');

        } else if($scope.javaModal=="C++ APM") {

          $('#c++Modal').modal('show');

        }
          else if($scope.javaModal=="Python APM") {
          $('#pythonModal').modal('show');
        }
        else {

        }
    }

    $scope.showProducts();
  }]);
