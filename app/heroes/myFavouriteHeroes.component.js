angular.module('myFavouriteHeroes.component', ['heroes.service'])

.component('myFavouriteHeroes', {
  template:
  '<div>' +
    '<h2>Favourites</h2>' +
    '<div ng-repeat="hero in $ctrl.heroes | filter : $ctrl.isFavourite">{{ hero.firstName }} {{ hero.lastName }}</div>' +
  '</div>',
  controller: MyFavouriteHeroes
});

function MyFavouriteHeroes(heroesService) {
  this.$onInit = function() {
    var _this = this;
    heroesService.getHeroes().then(function(heroes) {
      _this.heroes = heroes;
    });
  };
  this.isFavourite = function(hero) {
    return heroesService.isFavourite(hero);
  };
}
MyFavouriteHeroes.$inject = ['heroesService'];
