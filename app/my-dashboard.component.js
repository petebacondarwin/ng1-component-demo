angular.module('myDashboard.component', ['myFavouriteVillains.component'])

.component('myDashboard', {
  template:
    '<div>' +
      '<p>Welcome to the villains app</p>' +
      '<my-favourite-villains></my-favourite-villains>' +
    '</div>'
});