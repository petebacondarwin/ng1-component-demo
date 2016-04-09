angular.module('myApp.component', ['ngComponentRouter', 'myDashboard.component', 'myNavigationMenu.component', 'heroes'])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}])

.run(['$rootRouter', function($rootRouter) {
  $rootRouter.config([
    { path: '/...', component: 'myApp' }
  ]);
}])

.component('myApp', {
  $routeConfig: [
    { path: '/', component: 'myDashboard', name: 'Dashboard' },
    { path: '/heroes', component: 'myHeroes', name: 'EditHeroes' }
  ],
  template:
    '<h1>Heroes App</h1>' +
    '<my-navigation-menu></my-navigation-menu>' +
    '<ng-outlet></ng-outlet>'
});