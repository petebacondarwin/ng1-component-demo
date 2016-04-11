describe('myHeroes component', function() {

  function getComponentController() {
    var $ctrl;
    module('myHeroes.component');
    inject(function($componentController, $rootScope) {
      $ctrl = $componentController('myHeroes', {$scope: $rootScope});
    });
    return $ctrl;
  }

  describe('$onInit()', function() {
    it('should load the heroes', function() {
      var $ctrl = getComponentController();
      spyOn($ctrl, 'loadHeroes');
      $ctrl.$onInit();
      expect($ctrl.loadHeroes).toHaveBeenCalled();
    });
  });

  describe('loadHeroes()', function() {
    it('should get the heroes from the heroesService and attach them to a property', function() {
      var $ctrl = getComponentController();

      inject(function($rootScope) {
        $ctrl.loadHeroes();
        $rootScope.$apply();
        expect($ctrl.heroes[0]).toEqual({ id: 0, firstName: 'Wonder', lastName: 'Woman' });
      });
    });
  });

  describe('saveHero(hero, firstName, lastName)', function() {
    it('should call save() on the heroesService', function() {
      var $ctrl = getComponentController();
      inject(function(heroesService) {
        spyOn(heroesService, 'save');
        $ctrl.saveHero({id: 2}, 'newFirstName', 'newLastName');
        expect(heroesService.save).toHaveBeenCalledWith(2, 'newFirstName', 'newLastName');
      })
    });
  });

  describe('toggleFavourite(hero)', function() {
    it('should call toggleFavourite() on the heroesService', function() {
      var $ctrl = getComponentController();
      inject(function(heroesService) {
        var someHero = {};
        spyOn(heroesService, 'toggleFavourite');
        $ctrl.toggleFavourite(someHero);
        expect(heroesService.toggleFavourite).toHaveBeenCalledWith(someHero);
      });
    });
  });

  describe('isFavourite(hero)', function() {
    it('should call isFavourite() on the heroesService', function() {
      var $ctrl = getComponentController();
      inject(function(heroesService) {
        var someHero = {};
        spyOn(heroesService, 'isFavourite');
        $ctrl.isFavourite(someHero);
        expect(heroesService.isFavourite).toHaveBeenCalledWith(someHero);
      });
    });
  });
});