angular.module('myFavouriteVillains.component', ['villains.service'])

.component('myFavouriteVillains', {
  template:
  '<div>' +
    '<h2>Favourites</h2>' +
    '<div ng-repeat="villain in $ctrl.villains | filter : $ctrl.isFavourite">{{ villain.firstName }} {{ villain.lastName }}</div>' +
  '</div>',
  controller: MyFavouriteVillains
});

function MyFavouriteVillains(villainsService) {
  this.$onInit = function() {
    var _this = this;
    villainsService.getVillains().then(function(villains) {
      _this.villains = villains;
    });
  };
  this.isFavourite = function(villain) {
    return villainsService.isFavourite(villain);
  };
}
MyFavouriteVillains.$inject = ['villainsService'];
