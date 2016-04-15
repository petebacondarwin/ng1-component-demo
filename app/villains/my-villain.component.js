angular.module('myVillain.component', ['myTakeFocus.directive'])

.component('myVillain', {
  template:
    '<div class="my-villain">' +

      '<span class="full-name" ' +
            'ng-if="!$ctrl.editing" ' +
            'ng-click="$ctrl.editing=true">' +
              '{{$ctrl.fullName}}' +
      '</span>' +

      '<input class="full-name" type="text" ' +
              'my-take-focus="$ctrl.editing" ' +
              'ng-if="$ctrl.editing"' +
              'ng-model="$ctrl.fullName" ' +
              'ng-blur="$ctrl.nameChanged()" ' +
              'ng-keyup="$ctrl.handleKey($event)">&nbsp;&nbsp;' +

      '<label>Like: ' +
        '<input type="checkbox" ' +
               'ng-model="$ctrl.isFavourite" ' +
               'ng-click="$ctrl.onIsFavouriteChange()">' +
      '</label>' +
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
    this.editing = false;
    this.onVillainChange({$event: splitName(this.fullName)});
  },
  handleKey: function($event) {
    switch($event.keyCode) {
      case 27: // ESC
        this.fullName = getFullName(this.villain);
        this.editing = false;
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
