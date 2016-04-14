angular.module('myTakeFocus.directive', [])

.directive('myTakeFocus', function() {
  return function link(scope, element, attr) {
    scope.$watch(attr.myTakeFocus, function(val) {
      if (val) {
        element[0].focus();
      }
    });
  };
});