(function () {'use strict';

angular.
  module('frenchToast.component', []).
  component('frenchToast', {
    template: '<div>{{ $ctrl.topping }}</div>',
    bindings: {
      topping: '<',
      whenReady: '&'
    },
    controller: FrenchToastController
  });

// Functions - Definitions
function FrenchToastController($element, $timeout) {
  // Constants
  var HIDE_DELAY = 3000;

  // Variables - Private
  var self = this;

  // Lifecycle hooks
  self.$postLink = $postLink;

  // Functions - Definitions
  function $postLink() {
    $timeout(self.whenReady, HIDE_DELAY);
  }
}

}());
