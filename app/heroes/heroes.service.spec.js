describe('heroes.service', function() {

  function getHeroes() {
    var heroes;
    module('heroes.service');
    inject(function(heroesService, $rootScope) {

      heroesService.getHeroes().then(function(val) { heroes = val; });
      $rootScope.$apply();
    });
    return heroes;
  }

  describe('getHeroes', function() {
    it('should return a promise to an array of hero objects', function() {
      var heroes = getHeroes();
      expect(heroes[0]).toEqual({ id: 0, firstName: 'Wonder', lastName: 'Woman' });
    });
  });


  describe('save', function() {
    it('should replace the specified hero object with a new one (immutable)', function() {
      var heroes = getHeroes();
      inject(function(heroesService) {
        var superMan = heroes[1];
        heroesService.save(superMan.id, "SUPER", "MAN");

        // original hero is unchanged
        expect(superMan).toEqual({ id: 1, firstName: 'Super', lastName: 'Man' });
        // new object replaces original hero
        expect(heroes[1]).toEqual({ id: 1, firstName: 'SUPER', lastName: 'MAN' })
      });
    });
  });


  describe('toggleFavourite', function() {
    it('should toggle whether a hero is a favourite', function() {
      var heroes = getHeroes();
      inject(function(heroesService) {
        var wonderWoman = heroes[0];
        expect(heroesService.isFavourite(wonderWoman)).toBeFalsy();
        heroesService.toggleFavourite(wonderWoman);
        expect(heroesService.isFavourite(wonderWoman)).toBeTruthy();
      });
    });
  });

  describe('isFavourite', function() {
    it('should return true for heroes that are favourites', function() {
      var heroes = getHeroes();
      inject(function(heroesService) {
        // the initial favourites are Super Man and Bat Girl
        expect(heroesService.isFavourite(heroes[1])).toBeTruthy();
        expect(heroesService.isFavourite(heroes[2])).toBeTruthy();
      });
    });
  });
});