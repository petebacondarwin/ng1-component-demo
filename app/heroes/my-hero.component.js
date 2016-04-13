angular.module('myVillain.component', [])

.component('myVillain', {
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
    villain: '<',
    onVillainChange: '&',
    isFavourite: '<',
    onIsFavouriteChange: '&'
  },
  controller: MyVillain
});

function MyVillain() {}

MyVillain.prototype = {
  $onChanges: function(changes) {
    if (changes.villain) {
      this.fullName = getFullName(changes.villain.currentValue);
    }
  },
  nameChanged: function() {
    this.onVillainChange({$event: splitName(this.fullName)});
  },
  handleKey: function($event) {
    switch($event.keyCode) {
      case 27: // ESC
        this.fullName = getFullName(this.villain);
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

function getFullName(villain) {
  return [villain.firstName, villain.lastName].join(' ').trim();
}
