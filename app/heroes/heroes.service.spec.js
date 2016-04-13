describe('villains.service', function() {

  function getVillains() {
    var villains;
    module('villains.service');
    inject(function(villainsService, $rootScope) {

      villainsService.getVillains().then(function(val) { villains = val; });
      $rootScope.$apply();
    });
    return villains;
  }

  describe('getVillains()', function() {
    it('should return a promise to an array of villain objects', function() {
      var villains = getVillains();
      expect(villains[0]).toEqual({ id: 0, firstName: 'Wonder', lastName: 'Woman' });
    });
  });


  describe('save(id, firstName, lastName)', function() {
    it('should replace the specified villain object with a new one (immutable)', function() {
      var villains = getVillains();
      inject(function(villainsService) {
        var superMan = villains[1];
        villainsService.save(superMan.id, "SUPER", "MAN");

        // original villain is unchanged
        expect(superMan).toEqual({ id: 1, firstName: 'Super', lastName: 'Man' });
        // new object replaces original villain
        expect(villains[1]).toEqual({ id: 1, firstName: 'SUPER', lastName: 'MAN' })
      });
    });
  });


  describe('toggleFavourite(villain)', function() {
    it('should toggle whether a villain is a favourite', function() {
      var villains = getVillains();
      inject(function(villainsService) {
        var wonderWoman = villains[0];
        expect(villainsService.isFavourite(wonderWoman)).toBeFalsy();
        villainsService.toggleFavourite(wonderWoman);
        expect(villainsService.isFavourite(wonderWoman)).toBeTruthy();
      });
    });
  });

  describe('isFavourite(villain)', function() {
    it('should return true for villains that are favourites', function() {
      var villains = getVillains();
      inject(function(villainsService) {
        // the initial favourites are Super Man and Bat Girl
        expect(villainsService.isFavourite(villains[1])).toBeTruthy();
        expect(villainsService.isFavourite(villains[2])).toBeTruthy();
      });
    });
  });
});