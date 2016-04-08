angular.module('myHero.component', [])

.component('myHero', {
  template:
    '<div>' +
      '<label>Name: <input type="text" ng-model="$ctrl.heroName" ng-change="$ctrl.changeName()"></label>&nbsp;' +
      '<label>Like: <input type="checkbox" ng-model="$ctrl.isFavourite" ng-click="$ctrl.onToggleFavourite()"></label>' +
    '</div>',
  bindings: {
    hero: '<',
    onChangeName: '&',
    isFavourite: '<',
    onToggleFavourite: '&'
  },
  controller: MyHero
});

function MyHero() {}

MyHero.prototype = {
  $onChanges: function() {
    this.heroName = this.hero.firstName + ' ' + this.hero.lastName;
  },
  updateHeroName: function() {
  },
  changeName: function() {
    var names = this.heroName.split(' ');
    this.onChangeName({firstName: names[0], lastName: names[1]});
  }
};