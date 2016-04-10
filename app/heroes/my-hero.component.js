angular.module('myHero.component', [])

.component('myHero', {
  template:
    '<div>' +
      '<label>Name: ' +
        '<input type="text" ' +
               'ng-model="$ctrl.fullName" ' +
               'ng-blur="$ctrl.nameChanged()" ' +
               'ng-keyup="$ctrl.handleKey($event)">' +
      '</label>&nbsp;' +
      '<label>Like: <input type="checkbox" ng-model="$ctrl.isFavourite" ng-click="$ctrl.onIsFavouriteChange()"></label>' +
    '</div>',
  bindings: {
    hero: '<',
    onHeroChange: '&',
    isFavourite: '<',
    onIsFavouriteChange: '&'
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
    this.onHeroChange({$event: splitName(this.fullName)});
  },
  handleKey: function($event) {
    switch($event.keyCode) {
      case 27: // ESC
        this.fullName = getFullName(this.hero);
        $event.preventDefault();
        break;
      case 13: // ENTER
        this.nameChanged();
        $event.preventDefault();
        break;
    }
  }
};

function splitName(name) {
  var match = /(\w+)\s*(.*)/.exec(name);
  return { firstName: match[1], lastName: match[2] };
}

function getFullName(hero) {
  return [hero.firstName, hero.lastName].join(' ').trim();
}
