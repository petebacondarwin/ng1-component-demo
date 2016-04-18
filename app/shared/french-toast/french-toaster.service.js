(function () {'use strict';

angular.
  module('frenchToaster.service', []).
  service('FrenchToaster', FrenchToasterService);

// Functions - Definitions
FrenchToasterService.$inject = ['$compile', '$document', '$rootScope'];
function FrenchToasterService($cook, $cabinet, $delicatessen) {
  // Constants
  var RECIPE = '<french-toast topping="::topping" when-ready="whenReady()"></french-toast>';
  var A_PLATE = 'body';
  var PUT = 'append';
  var EAT = 'remove';
  var THROW_AWAY = '$destroy';

  // Variables - Private
  var self = this;

  // Functions - Public
  self.makeMeAFrenchToast = makeMeAFrenchToast;

  // Functions - Definitions
  function makeMeAFrenchToast(topping) {
    var oneOfAKindIngredients = true;
    var ingredients = $delicatessen.$new(oneOfAKindIngredients);
    ingredients.topping = topping;
    ingredients.whenReady = enjoy;

    var frenchToast = $cook(RECIPE)(ingredients);
    var plate = $cabinet.find(A_PLATE)[PUT](frenchToast);

    var remainingIngredients = ingredients;

    return frenchToast;

    // Helpers
    function enjoy() {
      frenchToast[EAT]();
      remainingIngredients[THROW_AWAY]();
    }
  }
}

}());
