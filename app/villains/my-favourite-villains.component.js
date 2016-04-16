angular.module('myFavouriteVillains.component', ['villains.service'])

.component('myFavouriteVillains', {
  template:
    '<div>' +
      '<h2>Favourites</h2>' +
      '<ul class="favourites">' +
        '<li ng-repeat="villain in $ctrl.villains | filter : $ctrl.isFavourite">' +
          '{{ villain.firstName }} <strong>{{ villain.lastName }}</strong>' +
        '</li>' +
      '</ul>' +
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
