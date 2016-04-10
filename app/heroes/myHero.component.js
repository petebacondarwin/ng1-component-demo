angular.module('myHero.component', [])

.component('myHero', {
  template:
    '<div>' +
      '<label>Name: <input type="text" ng-model="$ctrl.fullName" ng-blur="$ctrl.nameChanged()"></label>&nbsp;' +
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
  $onChanges: function(changes) {
    if (changes.hero) {
      this.fullName = getFullName(changes.hero.currentValue);
    }
  },
  nameChanged: function() {
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
