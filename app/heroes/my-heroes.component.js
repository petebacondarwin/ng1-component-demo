angular.module('myVillains.component', ['villains.service', 'myFavouriteVillains.component'])

.component('myVillains', {
  template:
  '<div>' +
    '<h2>Edit Villains</h2>' +
    '<p>Changes are saved when you press enter or leave the edit box.<br>Cancel changes by pressing escape.</p>' +
    '<div ng-repeat="villain in $ctrl.villains track by villain.id">' +
      '<my-villain ' +
          'villain="villain" ' +
          'is-favourite="$ctrl.isFavourite(villain)" ' +
          'on-villain-change="$ctrl.saveVillain(villain, $event.firstName, $event.lastName)"' +
          'on-is-favourite-change="$ctrl.toggleFavourite(villain)">' +
      '</my-villain>' +
    '</div>' +
    '<my-favourite-villains></my-favourite-villains>' +
  '</div>',
  controller: MyVillains
});

function MyVillains(villainsService) {
  this.villainsService = villainsService;
}
MyVillains.$inject = ['villainsService'];

MyVillains.prototype = {
  $onInit: function() {
    this.loadVillains();
  },
  loadVillains: function() {
    var _this = this;
    this.villainsService.getVillains().then(function(villains) {
      _this.villains = villains;
    });
  },
  saveVillain: function(villain, firstName, lastName) {
    this.villainsService.save(villain.id, firstName, lastName);
  },
  toggleFavourite: function(villain) {
    this.villainsService.toggleFavourite(villain);
  },
  isFavourite: function(villain) {
    return this.villainsService.isFavourite(villain);
  }
};