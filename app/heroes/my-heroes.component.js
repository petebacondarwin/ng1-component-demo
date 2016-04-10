angular.module('myHeroes.component', ['heroes.service', 'myFavouriteHeroes.component'])

.component('myHeroes', {
  template:
  '<div>' +
    '<h2>Edit Heroes</h2>' +
    '<div ng-repeat="hero in $ctrl.heroes track by hero.id">' +
      '<my-hero ' +
          'hero="hero" ' +
          'is-favourite="$ctrl.isFavourite(hero)" ' +
          'on-hero-change="$ctrl.saveHero(hero, $event.firstName, $event.lastName)"' +
          'on-is-favourite-change="$ctrl.toggleFavourite(hero)">' +
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
  saveHero: function(hero, firstName, lastName) {
    this.heroesService.save(hero.id, firstName, lastName);
  },
  toggleFavourite: function(hero) {
    this.heroesService.toggleFavourite(hero);
  },
  isFavourite: function(hero) {
    return this.heroesService.isFavourite(hero);
  }
};