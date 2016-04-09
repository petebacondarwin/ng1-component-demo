angular.module('myNavigationMenu.component', ['ngComponentRouter'])

.component('myNavigationMenu', {
  template:
    '<nav>' +
      '<a ng-link="[\'Dashboard\']">Dashboard</a>&nbsp;' +
      '<a ng-link="[\'EditHeroes\']">Edit Heroes</a>' +
    '</nav>'
});