angular.module('myApp.component', [
  'ngComponentRouter',
  'myDashboard.component',
  'myNavigationMenu.component',
  'villains'
])

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
    { path: '/villains', component: 'myVillains', name: 'EditVillains' }
  ],
  template:
    '<img src="assets/images/villain.svg" class="logo" title="by J.J. - http://www.jjmccullough.com/">' +
    '<h1>Villainy<br>App</h1>' +
    '<my-navigation-menu></my-navigation-menu>' +
    '<ng-outlet></ng-outlet>'
});