angular.module('myHero.component', [])

.component('myHero', {
  template:
    '<div>' +
      '<label>Name: <input type="text" ng-model="$ctrl.fullName" ng-change="$ctrl.changeName()"></label>&nbsp;' +
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
    if (!sameName(splitName(this.fullName), this.hero)) {
      this.fullName = getFullName(this.hero);
    }
  },
  changeName: function() {
    this.onChangeName(splitName(this.fullName));
  }
};

function splitName(name) {
  var match = /(\w+)\s*(.*)/.exec(name);
  return { firstName: match[1], lastName: match[2] };
}

function getFullName(hero) {
  return [hero.firstName, hero.lastName].join(' ').trim();
}

function sameName(a, b) {
  return (a.firstName.trim() === b.firstName.trim() && a.lastName.trim() === b.lastName.trim());
}