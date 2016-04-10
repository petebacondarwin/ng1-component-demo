angular.module('myDashboard.component', ['myFavouriteHeroes.component'])

.component('myDashboard', {
  template:
    '<div>' +
      '<p>Welcome to the heroes app</p>' +
      '<my-favourite-heroes></my-favourite-heroes>' +
    '</div>'
});