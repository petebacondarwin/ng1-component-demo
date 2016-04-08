angular.module('heroes.service', [])

.factory('heroesService', ['$q', function($q) {

  var HEROES = [ // Simulate async loading
    { id: 0, firstName: 'Wonder', lastName: 'Woman' },
    { id: 1, firstName: 'Super', lastName: 'Man' },
    { id: 2, firstName: 'Bat', lastName: 'Girl' },
    { id: 3, firstName: 'Spider', lastName: 'Man' }
  ];
  var favourites = {};

  return {
    getHeroes: function() {
      return $q.when(HEROES);
    },
    save: function(id, firstName, lastName) {
      // Find the hero and replace it with the new data
      var index = 0;
      while(index < HEROES.length && HEROES[index].id !== id) { index += 1; }
      HEROES.splice(index, 1, { id: id, firstName: firstName, lastName: lastName});
    },
    toggleFavourite: function(hero) {
      favourites[hero.id] = !favourites[hero.id];
    },
    isFavourite: function(hero) {
      return favourites[hero.id];
    }
  };
}])