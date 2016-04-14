describe('myVillains component', function() {

  describe('$onInit()', function() {
    it('should load the villains', function() {
      var $ctrl = getComponentController();
      spyOn($ctrl, 'loadVillains');
      $ctrl.$onInit();
      expect($ctrl.loadVillains).toHaveBeenCalled();
    });
  });

  describe('loadVillains()', function() {
    it('should get the villains from the villainsService and attach them to a property', function() {
      var $ctrl = getComponentController();

      inject(function($rootScope) {
        $ctrl.loadVillains();
        $rootScope.$apply();
        expect($ctrl.villains[0]).toEqual({ id: 0, firstName: 'Poison', lastName: 'Ivy' });
      });
    });
  });

  describe('saveVillain(villain, firstName, lastName)', function() {
    it('should call save() on the villainsService', function() {
      var $ctrl = getComponentController();
      inject(function(villainsService) {
        spyOn(villainsService, 'save');
        $ctrl.saveVillain({id: 2}, 'newFirstName', 'newLastName');
        expect(villainsService.save).toHaveBeenCalledWith(2, 'newFirstName', 'newLastName');
      });
    });
  });

  describe('toggleFavourite(villain)', function() {
    it('should call toggleFavourite() on the villainsService', function() {
      var $ctrl = getComponentController();
      inject(function(villainsService) {
        var someVillain = {};
        spyOn(villainsService, 'toggleFavourite');
        $ctrl.toggleFavourite(someVillain);
        expect(villainsService.toggleFavourite).toHaveBeenCalledWith(someVillain);
      });
    });
  });

  describe('isFavourite(villain)', function() {
    it('should call isFavourite() on the villainsService', function() {
      var $ctrl = getComponentController();
      inject(function(villainsService) {
        var someVillain = {};
        spyOn(villainsService, 'isFavourite');
        $ctrl.isFavourite(someVillain);
        expect(villainsService.isFavourite).toHaveBeenCalledWith(someVillain);
      });
    });
  });

  function getComponentController() {
    var $ctrl;
    module('myVillains.component');
    inject(function($componentController) {
      $ctrl = $componentController('myVillains');
    });
    return $ctrl;
  }
});
