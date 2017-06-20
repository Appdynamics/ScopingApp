'use strict';

var app = angular.module('ScopingApp', ['ngRoute', 'ui.bootstrap', 'ngMaterial', 'ui.multiselect', 'ui.grid', 'ui.grid.edit']);



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
    .when("/app/:povId", {
      templateUrl: "/static/partials/povapp.html",
      controller: "DetailCtrl"
    })
    .when("/app/:povId/page/:appId", {
      templateUrl: "/static/partials/appPage.html",
      controller: "DetailCtrl"
    })
    .when("/admin", {templateUrl: "/static/partials/adminPortal.html", controller: "PageCtrl"})
    .when("/admin/page", {templateUrl: "/static/partials/sequence.html", controller: "PageCtrl"})
    .when("/update", {templateUrl: "/static/partials/update.html", controller: "PageCtrl"})
    .otherwise("/404", {templateUrl: "/static/partials/404.html", controller: "PageCtrl"});
}]);


/**
 * Service to get POV/APP Details
 */
 app.service('productService', function($http) {

   var currentId;
   var appId;
   var currentSequence;
   var count;
   var language;
   var parentId;
   var followupquestion;
   var keys;
   var recordedResponses;

   this.createResponse = function(){
     this.recordedResponses = [];
   }

   this.pushResponse = function(key) {
     this.recordedResponses.push(key);
   }

   this.getRecordedResponses = function(){
     return this.recordedResponses;
   }

   this.setKeys = function(key) {
     this.keys = key;
   }

   this.getKeys = function() {
     return this.keys;
   }

   this.popKeys = function() {
     this.keys.splice(0,1)
   }

   this.setId = function(id){
     this.currentId = id;
   };

   this.getId = function() {
     return this.currentId;
   };

   this.setParentId = function(id){
     this.parentId = id;
   };

   this.getParentId = function() {
     return this.parentId;
   };

   this.setFollowUp = function(questions) {
     this.followupquestion = questions;
   }

   this.getFollowUp = function() {
     return this.followupquestion
   }

   this.popQuestions = function() {
     this.followupquestion.splice(0,1)
   }

   this.setCount = function(value){
     this.count = value;
   };

   this.resetCount = function(){
     this.count = 0;
   };

   this.increaseCount = function(num)
   {
     this.count = this.count + num;
   }

   this.getCount = function()
   {
     return this.count;
   }

   this.setAppId = function(id) {
     this.appId = id;
   };

   this.getAppId = function() {
     return this.appId;
   };

   this.setLanguage = function(language) {
     this.language = language;
   };

   this.getLanguage = function() {
     return this.language;
   };


   this.setCurrentSequence = function(name){
     this.currentSequence = name;
   };

   this.getCurrentSequence = function() {
     return this.currentSequence;
   };

   this.getPovs = function(povid) {

    return $http({
             method: 'POST',
             url: '/getPov',
             data: {
                 id: povid
             }
         }).then(function(response) {
             //console.log(response.data)
             return response.data;
           }, function(error) {
             console.log(error);
             return error
           });

   };

   this.getApps = function(povid) {

    return $http({
               method: 'POST',
               url: '/getApps',
               data: {id: povid}
           }).then(function(response) {
               //console.log(response.data)
               return response.data;
             }, function(error) {
                 console.log(error);
                 return error
             });
   };

   this.getApp = function(appid) {

    return $http({
               method: 'POST',
               url: '/api/getApp',
               data: {id: appid}
           }).then(function(response) {
               //console.log(response.data)
               return response.data;
             }, function(error) {
                 console.log(error);
                 return error
             });
   };

   this.getSequences = function(name) {
    return $http({
             method: 'POST',
             url: '/api/getSequences',
             data: {language : name}
         }).then(function(response) {
            return response.data;
         }, function(error) {
             console.log(error);
         });

   }

   this.getLogicSequences = function(name) {
     return $http({
              method: 'GET',
              url: '/api/getLogicSequences',
              params: {language : name}
          }).then(function(response) {
             return response.data;
          }, function(error) {
              console.log(error);
          });

   }

   this.getResponses = function() {
    return $http({
             method: 'GET',
             url: '/api/getResponses'
         }).then(function(response) {
            return response.data;
         }, function(error) {
             console.log(error);
         });
   }

   this.getUserResponses = function(appid) {
    return $http({
             method: 'POST',
             url: '/api/getUserResponses',
             data: {id : appid}
         }).then(function(response) {
            return response.data;
         }, function(error) {
             console.log(error);
         });
   }

 });

/**
 * Controls the Pages
 */
app.controller('PageCtrl', function ($scope, $location, $http, $uibModal, $routeParams, productService) {
  console.log("POV Controller reporting for duty.");

    $scope.info = {};
    $scope.selectedProducts = {};
    $scope.povid = null;
    $scope.selectedPov = null;
    $scope.showAdd = true;
    $scope.showAddSequence = true;
    $scope.showUpdateSequence = true;
    $scope.submitLogicSequence = false;
    $scope.showOther = true;
    $scope.showLogic = true;
    $scope.showContinue = false;
    $scope.other = false;
    $scope.email = null;
    $scope.users = {};
    $scope.javaSequences = {};
    $scope.followUpArray = [];


    $scope.answers = [{id: 'answer1'}];
    $scope.responseList = [{id: 'response1'}];

    productService.getResponses().then(function(response) {
      $scope.responses = response;
    });



    $scope.languagecheck = productService.getLanguage();

    $scope.refreshSequences = function() {
      if (angular.isDefined($scope.languagecheck)) {
      productService.getLogicSequences($scope.languagecheck).then(function(response) {
        $scope.javaSequences = response;
        //console.log($scope.arrayofproducts)
        });
      }
    }


    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[3];
    $scope.altInputFormats = ['M!/d!/yyyy'];


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

    $scope.open3 = function() {
      $scope.popup3.opened = true;
    };

    $scope.popup3 = {
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

    $scope.showProducts = function() {
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

     //on click we will just go to the sequence page and set the language service
     //as a reference which will then load the appropriate sequence, no need
     //for multiple pages or lower case etc

    $scope.adminRoute = function(name) {
      productService.setLanguage(name)
      $location.path('/admin/page')
    }

    $scope.showJavaSequence = function() {
       $scope.showContinue = false;
       $scope.showAddSequence= true;
       $('#javaSequence').modal('show');
    }

    $scope.showLogicSequence = function() {
       $scope.showAddSequence= false;
       $scope.showContinue = true;
       $('#javaSequence').modal('show');
    }

    //just check if value is defined or in list of responses
    $scope.isOther = function(value) {

      $scope.checkUndefined = value;
      if(value == 'Supported!' || value == 'Not Supported!' || value == '4.4 Release' || value == 'Follow Up' || value == 'Terminate' || value == 'Low Risk' || value == 'Medium Risk' || value == 'High Risk')
      {
        $scope.showOther = true;
        return $scope.showOther
      }
      else if (value == 'Terminate') {
        $scope.showContinue = true;
        return $scope.showContinue
      }
      else if (value == 'Follow Up') {
        $scope.showContinue = true;
        return $scope.showContinue
      }
      else if(!angular.isDefined($scope.checkUndefined)) {
        $scope.showOther = true;
        return $scope.showOther
      }
      else {
        $scope.showOther = false;
        return $scope.showOther
      }
    }

    $scope.isOtherLogic = function(value) {
      $scope.checkUndefined = value;
      if(value == 'Supported!' || value == 'Not Supported!' || value == '4.4 Release' || value == 'Follow Up' || value == 'Terminate' || value == 'Low Risk' || value == 'Medium Risk' || value == 'High Risk')
      {
        $scope.showOther = true;
        return $scope.showOther
      }
      else if(!angular.isDefined($scope.checkUndefined)) {
        $scope.showOther = true;
        return $scope.showOther
      }
      else {
        $scope.showOther = false;
        return $scope.showOther
      }
    }

    $scope.followUp = function() {

      $http({
          method: 'POST',
          url: '/addLogicSequence',
          data: {
              info: $scope.info,
              answers: $scope.answers,
              language: $scope.languagecheck,
              parent: ''
          }
      }).then(function(response) {
          productService.setParentId(response.data.parentid)
          productService.setFollowUp(response.data.answerstofollow)
          $scope.refreshSequences()
          $scope.info = {}
          $scope.answers = [{id: 'answer1'}];
          $('#javaSequence').modal('hide');
          $('.modal-backdrop').remove();
          $scope.showAddSequence = false;
          $scope.followUpQuestions();
      }, function(error) {
          console.log(error);
      });




    }

    //WHILE FOLLOW UP IS ! EMPTY LOOP THROUGH question SET
    $scope.followUpQuestions = function() {
      $scope.parent = productService.getParentId()
      $scope.questionSet = productService.getFollowUp()
      $scope.key = $scope.questionSet[0]

      //console.log($scope.questionSet)
      //console.log($scope.key)
      //rare issue where sometimes first follow up question is being forgotten
      if($scope.questionSet.length != 0)
      {
        window.alert("Your Next Sequence is " + $scope.questionSet[0])

        $scope.showContinue = false;
        $scope.submitLogicSequence = true;
        var modalInstance = $uibModal.open({
          templateUrl: '/static/partials/logicModal.html',
          controller: 'PageCtrl',
          scope: $scope
        });

        modalInstance.result.then(function() {


        }, function() {
          productService.popQuestions();
          $scope.followUpQuestions();
          $scope.refreshSequences();

          });
      }
      else{
        return
      }



      //console.log($scope.parent)
      //console.log($scope.questionSet)

    }

    $scope.submitSequence = function() {
      $http({
          method: 'POST',
          url: '/addLogicSequence',
          data: {
              info: $scope.info,
              answers: $scope.answers,
              language: $scope.languagecheck,
              parent: $scope.parent,
              key: $scope.key
          }
      }).then(function(response) {
          $scope.info = {}
          $scope.answers = [{id: 'answer1'}];
          $scope.refreshSequences();
          //$('.modal-backdrop').remove();
      }, function(error) {
          console.log(error);
      });
    }

    //If selected response is other drop down input box
    //adding sequence should update the scope
    $scope.addSequence = function() {

      $http({
          method: 'POST',
          url: '/addSequence',
          data: {
              info: $scope.info,
              answers: $scope.answers,
              language: $scope.languagecheck
          }
      }).then(function(response) {
          $('#javaSequence').modal('hide')
          $scope.refreshSequences()
          $scope.info = {}
          $scope.answers = [{id: 'answer1'}];
      }, function(error) {
          console.log(error);
      });

    }


    //open modal with these there
    $scope.editSequence = function(question, answers, responses) {
      $scope.questionEdit = question;
      $scope.answersEdit = answers;
      $scope.responsesEdit = responses;

      $scope.info.question = question;
      $scope.answers = [{id: 'answer1'}];

      for(var i = 0; i < $scope.answersEdit.length; ++i)
      {
        $scope.answers[i].name = $scope.answersEdit[i]
        $scope.answers[i].subject = $scope.responsesEdit[i]
        var newItemNo = $scope.answers.length+1;
        $scope.answers.push({'id':'answer'+newItemNo});
      }
      $scope.showAddSequence = false;
      $scope.showUpdateSequence = false;
      $('#javaSequence').modal('show');
      //console.log($scope.answers)
      //console.log($scope.questionEdit);
      //console.log($scope.answersEdit);
      //console.log($scope.responsesEdit);
      //console.log($scope.languagecheck)
    }

    $scope.fixSequenceModal = function () {
      $scope.info = {};
      $scope.answers = [{id: 'answer1'}];
      $scope.showUpdateSequence = true;
      $('.modal-backdrop').remove();
    }

    $scope.confirmDeleteSequence = function(question) {
      $scope.deleteSequenceId = question;
      $('#deleteConfirmSequence').modal('show');
    }

    $scope.deleteSequence = function() {
      $scope.languageDelete = productService.getLanguage();

      $http({
        method: 'POST',
        url: '/deleteSequence',
        data: {
          info:$scope.deleteSequenceId,
          language: $scope.languageDelete
        }
      }).then(function(response) {
        console.log(response.data);
        $scope.deleteSequence = '';
        $scope.refreshSequences();
        $('#deleteConfirmSequence').modal('hide')
      }, function(error) {
        console.log(error);
      });
    }

    $scope.updateSequence = function() {
      $http({
          method: 'POST',
          url: '/updateSequence',
          data: {
              info: $scope.info,
              answers: $scope.answers,
              language: $scope.languagecheck
          }
      }).then(function(response) {
          $('#javaSequence').modal('hide')
          $scope.refreshSequences()
          $scope.info = {}
          $scope.answers = [{id: 'answer1'}];
          $scope.showUpdateSequence = true;
      }, function(error) {
          console.log(error);
      });
    }

    $scope.addFields = function() {
      var newItemNo = $scope.answers.length+1;
      $scope.answers.push({'id':'answer'+newItemNo});
      $scope.responseList.push({'id':'response'+newItemNo});
      //console.log($scope.answers)
    }

    $scope.removeFields = function() {
      var lastItem = $scope.answers.length-1;
      $scope.answers.splice(lastItem);
      $scope.responseList.splice(lastItem);
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
            $scope.editPov(lastid,response.data.appid)
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
   						//console.log(response);
   						$scope.info = response.data;
   						$('#addPopUp').modal('show')
   					}, function(error) {
   						console.log(error);
   					});
   			}

    $scope.editPov = function(id, id2) {
        $scope.info.id = id;
        productService.setId(id);

        $location.path('app/'+id +'/page/' + id2)

    }

    $scope.changePage = function(id) {
        $scope.info.id = id;
        productService.setId(id);

        $location.path('app/'+id)

    }


    $scope.updatePov = function(id){

   					$http({
   						method: 'POST',
   						url: '/update',
   						data: {
                info:$scope.info
              }
   					}).then(function(response) {
   						//console.log(response.data);
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
						//console.log(response.data);
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
    $scope.refreshSequences()
});

app.controller("DetailCtrl", ['$scope', '$http', '$location', '$uibModal', '$routeParams', 'productService', function($scope, $http, $location, $uibModal, $routeParams, productService) {
  console.log("DetailCtrl Controller reporting for duty.");

    $scope.info = {};
    $scope.javaModal = null;
    $scope.selectedProducts = {};
    $scope.javaQuestionSequence = {};
    $scope.appdetails = {};
    $scope.showNext = true;
    $scope.showApp = true;
    $scope.showData = false;
    $scope.showOtherText = true;
    $scope.sequence = {};
    $scope.selectedResponse = '';
    $scope.selectedResponseOther = [];
    $scope.recordedResponses = [];
    $scope.recordedQuestions = [];
    $scope.userresponses = {};
    $scope.arrayofproducts = {};
    $scope.responsedetails = {};
    $scope.gridOptionsArray = [];
    $scope.copyArray = [];

    //check here to see if via click or refresh of apppage?

    //$scope.page = productService.getId();
    //$scope.appPage = productService.getAppId();
    $scope.page = $routeParams.povId;
    $scope.appPage = $routeParams.appId;
    $scope.currentSequence = productService.getCurrentSequence();

    // put everything below in refresh function
    //DOM isn't updating after subimitting response

    $scope.triggerChange = function (id) {
        setTimeout(function(){
            console.log('Updating Dom');
               productService.getUserResponses(id).then(function(response) {
                 $scope.responsedetails = response;
                 console.log($scope.responsedetails)
               });
        }, 2000);

    };

    $scope.convertArrayOfStringsToGridFriendlyJSON = function(colName, arr)    {
      var out = [];
      arr.forEach(function(entry){
        var obj = {};
        obj[colName] = entry;
        out.push(obj);
      });
      return out;
    }



    $scope.refreshDetails = function() {

      productService.getPovs($scope.page).then(function(response) {
        $scope.povdetails = response;

      });


      productService.getApps($scope.page).then(function(response) {
        $scope.apps = response;
      });

      //console.log($scope.appPage)
      if (angular.isDefined($scope.appPage)) {

        productService.getApp($scope.appPage).then(function(response) {
          $scope.appdetails = response;

          //console.log($scope.arrayofproducts)
        });


        //I am going to loop through the response and I am going to create
        //an array of gridOptions where the column data is just the position of the
        //
        productService.getUserResponses($scope.appPage).then(function(response) {
          $scope.responsedetails = response;

          if($scope.responsedetails.length != 0)
          {
            $scope.showData = true;
            $scope.singleQuestion = '';
            $scope.singleTableData = [{}];
            $scope.singleInstance = {};
            $scope.tableList = [{}];
            console.log($scope.responsedetails)

            for(var i = 0; i < $scope.responsedetails.length; ++i)
            {
              for(var x = 0; x < $scope.responsedetails[i].languageQuestions.length; ++x)
              {
                $scope.singleTableData.question = $scope.responsedetails[i].languageQuestions[x]
                $scope.singleTableData.userResponses = $scope.responsedetails[i].userResponses[x]
                $scope.singleTableData.userFeedback = $scope.responsedetails[i].userFeedback[x]

                //console.log($scope.singleTableData.userFeedback)
                //console.log($scope.singleTableData.userResponses)
                //there is an error occuring here when userResponses length is undefined
                if(angular.isDefined($scope.singleTableData.userResponses)){
                  for( var t =0; t < $scope.singleTableData.userResponses.length; ++t )
                  {
                    $scope.singleInstance = {
                      'Question' : $scope.singleTableData.question,
                      'User Response' : $scope.singleTableData.userResponses[t],
                      'User Feedback' : $scope.singleTableData.userFeedback[t],
                    }
                    $scope.tableList.push($scope.singleInstance);
                  }
                }


                //set enableSorting to true
                $scope.gridOptions = {
                  data: 'tableList',
                  enableSorting: true,
                  columnDefs : [{
                    field: 'Question',
                    displayName: 'Question',
                    width: "*",
                    enableCellEdit: true
                  },
                  {
                    field:'User Response',
                    displayName: 'Your Response',
                    enableCellEdit: true
                  },
                  {
                    field:'User Feedback',
                    displayName: 'AppD Feedback',
                    width: "*",
                    enableCellEdit: true
                  }]
                };
              }
            }

            $scope.gridOptionsArray.push($scope.gridOptions)

            //console.log($scope.gridOptionsArray)
            //console.log($scope.responsedetails)

          }
          else {
            $scope.showData = false;
          }
        });
      }
    }

    $scope.getAppPage = function () {
      $scope.appvariable = productService.getId()
      $location.path('app/'+$scope.appvariable)

    }

    //on next question, need to check and see if recorded response has a follow up
    //question, if it does go there, otherwise
    $scope.refresh = function()    {
      if (angular.isDefined($scope.currentSequence)) {
        var currentCount4 = productService.getCount();

        $scope.keys = productService.getKeys();

        console.log($scope.keys)
        console.log(currentCount4)

        if(angular.isDefined($scope.keys) && $scope.keys.length != 0){
          for(var i = currentCount4; i < $scope.currentSequence.length; ++i){
            if($scope.keys[0] == $scope.currentSequence[i].key){
              console.log($scope.currentSequence[i].key)
              //here i need to check and see if there are any more parent questions left
              productService.popKeys();
              $scope.keyEndCheck = productService.getKeys()
              for(var p = i + 1; p < $scope.currentSequence.length; ++p){
                if($scope.currentSequence[p].key == ''){
                    break;
                }
                else if(p > $scope.currentSequence.length - 2 && $scope.keyEndCheck.length == 0) {
                  $scope.showNext = false;
                }
                else{

                }
              }
              $scope.sequence.question = $scope.currentSequence[i].question
              $scope.sequence.answers = $scope.currentSequence[i].answers
              $scope.showOtherText = $scope.isOtherValue($scope.selectedResponse)
              productService.setCount(i)

              break;
            }
            else if ($scope.keys.length == 0){
              console.log('empty keys')
              productService.increaseCount(1)
              for(var t = productService.getCount(); t < $scope.currentSequence.length; ++t){
                console.log($scope.currentSequence[t].key)
                console.log(t)
                if($scope.currentSequence[t].key == '' && t < $scope.currentSequence.length) {
                  $scope.sequence.question = $scope.currentSequence[t].question
                  $scope.sequence.answers = $scope.currentSequence[t].answers
                  $scope.showOtherText = $scope.isOtherValue($scope.selectedResponse)
                  productService.setCount(t)
                  break;
                }
                else if( t > $scope.currentSequence.length - 2){
                  console.log('last question')
                  $scope.showNext = false;
                }
                else {
                  console.log('heretwenty')
                }
              }
              break;
            }
            else if (i == $scope.currentSequence.length -1){
              console.log('key not found reset loop')
              i = currentCount4;
              productService.popKeys();
            }
            else if ($scope.keys[0] == 'Other') {
              console.log('Key is other, should be next question w/out parent')
              productService.popKeys();
              productService.increaseCount(1);

              for(var x = productService.getCount(); x < $scope.currentSequence.length; ++x){
                if($scope.currentSequence[x].key == ''){
                  productService.setCount(x);
                  $scope.sequence.question = $scope.currentSequence[x].question
                  $scope.sequence.answers = $scope.currentSequence[x].answers
                  $scope.showOtherText = $scope.isOtherValue($scope.selectedResponse)
                  break;
                }
                else if( x > $scope.currentSequence.length - 2){
                  console.log('last question')
                  $scope.showNext = false;
                }
                else{

                }
              }
              break;
            }
            else {
              console.log('here again')
            }
          }
        }
        else {
          console.log(currentCount4)
          for(var i = currentCount4; i < $scope.currentSequence.length; ++i){
            if($scope.currentSequence[i].key == '') {
              productService.setCount(i)
              break;
            }
          }
          var currentCount4 = productService.getCount();
          $scope.sequence.question = $scope.currentSequence[currentCount4].question
          $scope.sequence.answers = $scope.currentSequence[currentCount4].answers
          $scope.showOtherText = $scope.isOtherValue($scope.selectedResponse)
        }
        //$scope.showOtherText = true;
        //console.log($scope.sequence.question)
        //console.log($scope.sequence.answers)
        //console.log(currentCount4)
      }
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

    $scope.addAppAgain = function(){
      $('#addApp').modal('show');
    }

    $scope.fixModel = function() {
      $scope.showApp = true;
      $scope.info = {};
    }




    $scope.editApp = function(id){
   				$scope.info.id = id;

   				$scope.showApp = false;

   				$http({
   						method: 'POST',
   						url: '/api/getApp',
   						data: {id:$scope.info.id}
   				}).then(function(response) {
   						console.log(response);
   						$scope.info = response.data;
              $scope.selectedProducts = {};
   						$('#addApp').modal('show');
   					}, function(error) {
   						console.log(error);
   					});
   			}

    $scope.updateApp = function(){

   				$http({
     					method: 'POST',
   					  url: '/updateApp',
       				data: {
                info:$scope.info,
                products: $scope.selectedProducts
              }
       			}).then(function(response) {
              //console.log($scope.selectedProducts)
              //console.log($scope.info)
       				//console.log(response.data);

              $('#addApp').modal('hide');
              $scope.showApp = true;
              $scope.refreshDetails();
       				//$scope.showlist();
              //function to update dom

       			}, function(error) {
       				console.log(error);
       			});
       }

    $scope.confirmDelete = function(id){
       $scope.deleteAppId = id;
       $('#deleteConfirm').modal('show');
    }

    $scope.deleteApp = function() {
      $http({
        method: 'POST',
        url: '/deleteApp',
        data: {
          id:$scope.deleteAppId
        }
      }).then(function(response) {
        console.log(response.data);
        $scope.deleteAppId = '';
        $('#deleteConfirm').modal('hide')
        $scope.refreshDetails();
      }, function(error) {
        console.log(error);
      });

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
          //console.log(response);
          $('#addApp').modal('hide');
          $scope.info = {};
          $scope.selectedProducts = {};
          productService.getApps($scope.page).then(function(response) {
            $scope.apps = response;
          });
          //$location.path('povapp')
      }, function(error) {
          console.log(error);
      });
    }

    //get individual app details here for selected app page
    $scope.showAppPage = function(appid) {
      var currentUrl = $location.path()
      //console.log(currentUrl)
      $location.path(currentUrl + '/page/' + appid);
      productService.setAppId(appid);
    }

    $scope.isOtherValue = function(value) {
      $scope.checkUndefined = value;
      if(value == 'Other')
      {
        $scope.showOtherText = false;
        return $scope.showOtherText
      }
      else if(value=='changeback') {
        $scope.showOtherText = true;
        return $scope.showOtherText
      }
      else {
        $scope.showOtherText = true;
        return $scope.showOtherText
      }

    }

    $scope.resetSequence = function() {
      productService.resetCount();

    }
    //Seperate questions/answers from responses, do table like questions/answers
    //get size of questions, then loop through one by one, passing each object
    //down to the modal, appending the responses to an array and updating each
    //iteration
    $scope.startSequence = function(name) {
        $scope.language = name;
        productService.getLogicSequences($scope.language).then(function(response) {
          $scope.javaSequenceUser = response;
          productService.setCurrentSequence($scope.javaSequenceUser)
          productService.resetCount();

          $scope.refresh()

          var modalInstance = $uibModal.open({
            templateUrl: '/static/partials/sequenceModal.html',
            controller: 'DetailCtrl',
            scope: $scope
          });

          modalInstance.result.then(function() {

          }, function() {
            $scope.refreshDetails();

        });

          //console.log($scope.javaSequenceUser)
      });
    }

    //before getting the current sequence, need to see if there is a followUp
    $scope.nextQuestion = function() {

      $scope.sequence = productService.getCurrentSequence();
      var countCheck = $scope.javaSequenceUser.length;
      var currentCount = productService.getCount();
      $scope.checkKeys = productService.getKeys();
      //console.log($scope.checkKeys)

      if(!angular.isDefined($scope.checkKeys) || $scope.checkKeys.length == 0){
        productService.setKeys($scope.selectedResponse)
      }
      else {
        //productService.popKeys();
      }

      //console.log(currentCount);
      //console.log($scope.checkKeys)
      //console.log(countCheck);
      //console.log($scope.selectedResponse);
      console.log($scope.sequence)



      if(countCheck == currentCount)
      {
          $scope.showNext = false;
          //console.log(currentCount)
      }
      else if (currentCount < countCheck - 1)
      {
        if($scope.selectedResponse == "Other")
        {
          $scope.copyArray = $scope.selectedResponseOther.split()
          var item = angular.copy($scope.copyArray)
          if(angular.isDefined($scope.sequence.question)){
            var question = angular.copy($scope.sequence.question)
            $scope.recordedQuestions.push(question)
          }
          else {
            var question = angular.copy($scope.sequence[0].question)
            $scope.recordedQuestions.push(question)
          }


          $scope.recordedResponses.push(item)

          console.log($scope.recordedResponses)
          var checkIfFinished = productService.getCount();

          if(checkIfFinished == countCheck - 1)
          {
            $scope.showNext = false;
          }
          $scope.selectedResponseOther = ''
          $scope.selectedResponse = 'changeback'
          $scope.copyArray = []
          $scope.refresh();

        }
        else {
          var item = angular.copy($scope.selectedResponse)

          $scope.recordedResponses.push(item)


          if(angular.isDefined($scope.sequence.question)){
            var question = angular.copy($scope.sequence.question)
            $scope.recordedQuestions.push(question)
          }
          else {
            var question = angular.copy($scope.sequence[0].question)
            $scope.recordedQuestions.push(question)
          }
          //console.log($scope.recordedResponses)
          //productService.increaseCount(1);
          var checkIfFinished = productService.getCount();
          if(checkIfFinished == countCheck - 1)
          {
            $scope.showNext = false;
          }
          $scope.selectedResponse = 'changeback'
          $scope.refresh();
        }
      }
      else {
        $scope.showNext = false;
        //console.log(currentCount)
        //console.log($scope.sequence)
      }
    }

    $scope.submitProductDetails = function() {
      if($scope.selectedResponse == "changeback"){

      }
      else if($scope.selectedResponse != "Other") {
        $scope.recordedResponses.push($scope.selectedResponse)
        $scope.recordedQuestions.push($scope.sequence.question)
      }
      else {
        $scope.copyArray = $scope.selectedResponseOther.split()
        $scope.recordedResponses.push($scope.copyArray)
        $scope.recordedQuestions.push($scope.sequence.question)
      }


      //$scope.completedSequences.push($scope.language)
      //console.log($scope.recordedResponses)
      $http({
          method: 'POST',
          url: '/api/addResponses',
          data: {
              language: $scope.language,
              id: $scope.appdetails.id,
              responses: $scope.recordedResponses,
              questions: $scope.recordedQuestions
          }
      }).then(function(response) {
          //$uibModal.dismissAll();
          //console.log(response);
          //productService.getUserResponses($scope.appdetails.id).then(function(response) {
            //$scope.responsedetails = response;
            //console.log($scope.responsedetails)
          //});
          //
          //$scope.refreshDetails();
          //$scope.triggerChange($scope.appdetails.id);
          $scope.recordedResponses = [];

      }, function(error) {
          console.log(error);
      });
    }

    $scope.saveNotes = function() {

      $http({
          method: 'POST',
          url: '/saveNotes',
          data: {
              info: $scope.appdetails.notes,
              id: $scope.appdetails.id
          }
      }).then(function(response) {
          //console.log(response);
          //$scope.refreshDetails();


      }, function(error) {
          console.log(error);
      });

    }


    $scope.showProducts();
    $scope.refresh();
    $scope.refreshDetails();
  }]);
