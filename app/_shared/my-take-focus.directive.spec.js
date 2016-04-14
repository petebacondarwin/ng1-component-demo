describe('myTakeFocus directive', function() {
  it('should call focus on the directive\'s element, when the given expression becomes true', function() {
    module('myTakeFocus.directive');
    inject(function($compile, $rootScope) {
      var element = $compile('<input my-take-focus="val">')($rootScope);
      spyOn(element[0], 'focus');
      $rootScope.$apply('val = true');
      expect(element[0].focus).toHaveBeenCalled();
    });
  });
});