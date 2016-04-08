angular.module('myApp.component', ['ngComponentRouter', 'myDashboard.component', 'heroes'])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}])

.value('$routerRootComponent', 'myApp')

.component('myApp', {
  $routeConfig: [
    { path: '/', component: 'myDashboard', name: 'Dashboard' },
    { path: '/heroes', component: 'myHeroes', name: 'EditHeroes' }
  ],
  template:
    '<h1>Heroes App</h1>' +
    '<a ng-link="[\'Dashboard\']">Dashboard</a>&nbsp;' +
    '<a ng-link="[\'EditHeroes\']">Edit Heroes</a>' +
    '<ng-outlet></ng-outlet>'
});