angular.module('myHeroes.component', ['heroes.service', 'myFavouriteHeroes.component'])

.component('myHeroes', {
  template:
  '<div>' +
    '<h2>Edit Heroes</h2>' +
    '<div ng-repeat="hero in $ctrl.heroes track by $index">' +
      '<my-hero ' +
          'hero="hero" ' +
          'is-favourite="$ctrl.isFavourite(hero)" ' +
          'on-change-name="$ctrl.updateHero(hero, firstName, lastName)"' +
          'on-toggle-favourite="$ctrl.toggleFavourite(hero)">' +
      '</my-hero>' +
    '</div>' +
    '<my-favourite-heroes></my-favourite-heroes>' +
  '</div>',
  controller: MyHeroes
});

function MyHeroes(heroesService) {
  this.heroesService = heroesService;
}
MyHeroes.$inject = ['heroesService'];

MyHeroes.prototype = {
  $onInit: function() {
    this.loadHeroes();
  },
  loadHeroes: function() {
    var _this = this;
    this.heroesService.getHeroes().then(function(heroes) {
      _this.heroes = heroes;
    });
  },
  updateHero: function(hero, firstName, lastName) {
    this.heroesService.save(hero.id, firstName, lastName);
  },
  toggleFavourite: function(hero) {
    this.heroesService.toggleFavourite(hero);
  },
  isFavourite: function(hero) {
    return this.heroesService.isFavourite(hero);
  }
};