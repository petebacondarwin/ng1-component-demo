angular.module('villains.service', [])

.factory('villainsService', ['$q', function($q) {

  var VILLAINS = [ // Simulate async loading
    { id: 0, firstName: 'Poison', lastName: 'Ivy' },
    { id: 1, firstName: 'Doctor', lastName: 'Octopus' },
    { id: 2, firstName: 'Mystique', lastName: '' },
    { id: 3, firstName: 'Green', lastName: 'Goblin' }
  ];
  var favourites = {
    1: true,
    2: true
  };

  return {
    getVillains: function() {
      return $q.when(VILLAINS);
    },
    save: function(id, firstName, lastName) {
      // Find the villain and replace it with the new data
      var index = 0;
      while(index < VILLAINS.length && VILLAINS[index].id !== id) { index += 1; }
      VILLAINS.splice(index, 1, { id: id, firstName: firstName, lastName: lastName});
    },
    toggleFavourite: function(villain) {
      favourites[villain.id] = !favourites[villain.id];
    },
    isFavourite: function(villain) {
      return favourites[villain.id];
    }
  };
}]);
