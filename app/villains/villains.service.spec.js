describe('villains.service', function() {

  describe('getVillains()', function() {
    it('should return a promise to an array of villain objects', function() {
      var villains = getVillains();
      expect(villains[0]).toEqual({ id: 0, firstName: 'Poison', lastName: 'Ivy' });
    });
  });


  describe('save(id, firstName, lastName)', function() {
    it('should replace the specified villain object with a new one (immutable)', function() {
      var villains = getVillains();
      inject(function(villainsService) {
        var superMan = villains[1];
        villainsService.save(superMan.id, "Otto", "Octavius");

        // original villain is unchanged
        expect(superMan).toEqual({ id: 1, firstName: 'Doctor', lastName: 'Octopus' });
        // new object replaces original villain
        expect(villains[1]).toEqual({ id: 1, firstName: 'Otto', lastName: 'Octavius' });
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
        // the initial favourites are villain 2 and 3 in the list
        expect(villainsService.isFavourite(villains[1])).toBeTruthy();
        expect(villainsService.isFavourite(villains[2])).toBeTruthy();
      });
    });
  });
});

function getVillains() {
  var villains;
  module('villains.service');
  inject(function(villainsService, $rootScope) {
    villainsService.getVillains().then(function(val) { villains = val; });
    $rootScope.$apply();
  });
  return villains;
}
