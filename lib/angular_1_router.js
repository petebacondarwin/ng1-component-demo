(function(){
///<reference path="../typings/angularjs/angular.d.ts"/>
/**
 * @name ngOutlet
 *
 * @description
 * An ngOutlet is where resolved content goes.
 *
 * ## Use
 *
 * ```html
 * <div ng-outlet="name"></div>
 * ```
 *
 * The value for the `ngOutlet` attribute is optional.
 */
function ngOutletDirective($animate, $q, $rootRouter) {
    var rootRouter = $rootRouter;
    return {
        restrict: 'AE',
        transclude: 'element',
        terminal: true,
        priority: 400,
        require: ['?^^ngOutlet', 'ngOutlet'],
        link: outletLink,
        controller: (function () {
            function class_1() {
            }
            return class_1;
        })(),
        controllerAs: '$$ngOutlet'
    };
    function outletLink(scope, element, attrs, ctrls, $transclude) {
        var Outlet = (function () {
            function Outlet(controller, router) {
                this.controller = controller;
                this.router = router;
            }
            Outlet.prototype.cleanupLastView = function () {
                var _this = this;
                if (this.previousLeaveAnimation) {
                    $animate.cancel(this.previousLeaveAnimation);
                    this.previousLeaveAnimation = null;
                }
                if (this.currentScope) {
                    this.currentScope.$destroy();
                    this.currentScope = null;
                }
                if (this.currentElement) {
                    this.previousLeaveAnimation = $animate.leave(this.currentElement);
                    this.previousLeaveAnimation.then(function () { return _this.previousLeaveAnimation = null; });
                    this.currentElement = null;
                }
            };
            Outlet.prototype.reuse = function (instruction) {
                var next = $q.when(true);
                var previousInstruction = this.currentInstruction;
                this.currentInstruction = instruction;
                if (this.currentController && this.currentController.$routerOnReuse) {
                    next = $q.when(this.currentController.$routerOnReuse(this.currentInstruction, previousInstruction));
                }
                return next;
            };
            Outlet.prototype.routerCanReuse = function (nextInstruction) {
                var result;
                if (!this.currentInstruction ||
                    this.currentInstruction.componentType !== nextInstruction.componentType) {
                    result = false;
                }
                else if (this.currentController && this.currentController.$routerCanReuse) {
                    result = this.currentController.$routerCanReuse(nextInstruction, this.currentInstruction);
                }
                else {
                    result = nextInstruction === this.currentInstruction ||
                        angular.equals(nextInstruction.params, this.currentInstruction.params);
                }
                return $q.when(result);
            };
            Outlet.prototype.routerCanDeactivate = function (instruction) {
                if (this.currentController && this.currentController.$routerCanDeactivate) {
                    return $q.when(this.currentController.$routerCanDeactivate(instruction, this.currentInstruction));
                }
                return $q.when(true);
            };
            Outlet.prototype.deactivate = function (instruction) {
                if (this.currentController && this.currentController.$routerOnDeactivate) {
                    return $q.when(this.currentController.$routerOnDeactivate(instruction, this.currentInstruction));
                }
                return $q.when();
            };
            Outlet.prototype.activate = function (instruction) {
                var _this = this;
                this.previousInstruction = this.currentInstruction;
                this.currentInstruction = instruction;
                var componentName = this.controller.$$componentName = instruction.componentType;
                if (typeof componentName !== 'string') {
                    throw new Error('Component is not a string for ' + instruction.urlPath);
                }
                this.controller.$$template = '<' + dashCase(componentName) + ' $router="::$$router"></' +
                    dashCase(componentName) + '>';
                this.controller.$$router = this.router.childRouter(instruction.componentType);
                this.controller.$$outlet = this;
                var newScope = scope.$new();
                newScope.$$router = this.controller.$$router;
                this.deferredActivation = $q.defer();
                var clone = $transclude(newScope, function (clone) {
                    $animate.enter(clone, null, _this.currentElement || element);
                    _this.cleanupLastView();
                });
                this.currentElement = clone;
                this.currentScope = newScope;
                return this.deferredActivation.promise;
            };
            return Outlet;
        })();
        var parentCtrl = ctrls[0], myCtrl = ctrls[1], router = (parentCtrl && parentCtrl.$$router) || rootRouter;
        myCtrl.$$currentComponent = null;
        router.registerPrimaryOutlet(new Outlet(myCtrl, router));
    }
}
/**
 * This directive is responsible for compiling the contents of ng-outlet
 */
function ngOutletFillContentDirective($compile) {
    return {
        restrict: 'EA',
        priority: -400,
        require: 'ngOutlet',
        link: function (scope, element, attrs, ctrl) {
            var template = ctrl.$$template;
            element.html(template);
            $compile(element.contents())(scope);
        }
    };
}
function routerTriggerDirective($q) {
    return {
        require: '^ngOutlet',
        priority: -1000,
        link: function (scope, element, attr, ngOutletCtrl) {
            var promise = $q.when();
            var outlet = ngOutletCtrl.$$outlet;
            var currentComponent = outlet.currentController =
                element.controller(ngOutletCtrl.$$componentName);
            if (currentComponent.$routerOnActivate) {
                promise = $q.when(currentComponent.$routerOnActivate(outlet.currentInstruction, outlet.previousInstruction));
            }
            promise.then(outlet.deferredActivation.resolve, outlet.deferredActivation.reject);
        }
    };
}
/**
 * @name ngLink
 * @description
 * Lets you link to different parts of the app, and automatically generates hrefs.
 *
 * ## Use
 * The directive uses a simple syntax: `ng-link="componentName({ param: paramValue })"`
 *
 * ### Example
 *
 * ```js
 * angular.module('myApp', ['ngComponentRouter'])
 *   .controller('AppController', ['$rootRouter', function($rootRouter) {
 *     $rootRouter.config({ path: '/user/:id', component: 'user' });
 *     this.user = { name: 'Brian', id: 123 };
 *   });
 * ```
 *
 * ```html
 * <div ng-controller="AppController as app">
 *   <a ng-link="user({id: app.user.id})">{{app.user.name}}</a>
 * </div>
 * ```
 */
function ngLinkDirective($rootRouter, $parse) {
    return { require: '?^^ngOutlet', restrict: 'A', link: ngLinkDirectiveLinkFn };
    function ngLinkDirectiveLinkFn(scope, element, attrs, ctrl) {
        var router = (ctrl && ctrl.$$router) || $rootRouter;
        if (!router) {
            return;
        }
        var navigationInstruction = null;
        var link = attrs.ngLink || '';
        function getLink(params) {
            navigationInstruction = router.generate(params);
            scope.$watch(function () { return router.isRouteActive(navigationInstruction); }, function (active) {
                if (active) {
                    element.addClass('ng-link-active');
                }
                else {
                    element.removeClass('ng-link-active');
                }
            });
            var navigationHref = navigationInstruction.toLinkUrl();
            return $rootRouter._location.prepareExternalUrl(navigationHref);
        }
        var routeParamsGetter = $parse(link);
        // we can avoid adding a watcher if it's a literal
        if (routeParamsGetter.constant) {
            var params = routeParamsGetter();
            element.attr('href', getLink(params));
        }
        else {
            scope.$watch(function () { return routeParamsGetter(scope); }, function (params) { return element.attr('href', getLink(params)); }, true);
        }
        element.on('click', function (event) {
            if (event.which !== 1 || !navigationInstruction) {
                return;
            }
            $rootRouter.navigateByInstruction(navigationInstruction);
            event.preventDefault();
        });
    }
}
function dashCase(str) {
    return str.replace(/[A-Z]/g, function (match) { return '-' + match.toLowerCase(); });
}
/*
 * A module for adding new a routing system Angular 1.
 */
angular.module('ngComponentRouter', [])
    .directive('ngOutlet', ['$animate', '$q', '$rootRouter', ngOutletDirective])
    .directive('ngOutlet', ['$compile', ngOutletFillContentDirective])
    .directive('ngLink', ['$rootRouter', '$parse', ngLinkDirective])
    .directive('$router', ['$q', routerTriggerDirective]);

angular.module('ngComponentRouter').
    value('$route', null). // can be overloaded with ngRouteShim
    // Because Angular 1 has no notion of a root component, we use an object with unique identity
    // to represent this. Can be overloaded with a component name
    value('$routerRootComponent', new Object()).

    // Unfortunately, $location doesn't expose what the current hashPrefix is
    // So we have to monkey patch the $locationProvider to capture this value
    provider('$locationHashPrefix', ['$locationProvider', $locationHashPrefixProvider]).
    factory('$rootRouter', ['$q', '$location', '$browser', '$rootScope', '$injector', '$routerRootComponent', '$locationHashPrefix', routerFactory]);

function $locationHashPrefixProvider($locationProvider) {

  // Get hold of the original hashPrefix method
  var hashPrefixFn = $locationProvider.hashPrefix.bind($locationProvider);

  // Read the current hashPrefix (in case it was set before this monkey-patch occurred)
  var hashPrefix = hashPrefixFn();

  // Override the helper so that we can read any changes to the prefix (after this monkey-patch)
  $locationProvider.hashPrefix = function(prefix) {
    if (angular.isDefined(prefix)) {
      hashPrefix = prefix;
    }
    return hashPrefixFn(prefix);
  }

  // Return the final hashPrefix as the value of this service
  this.$get = function() { return hashPrefix; };
}

function routerFactory($q, $location, $browser, $rootScope, $injector, $routerRootComponent, $locationHashPrefix) {

  // When this file is processed, the line below is replaced with
  // the contents of `../lib/facades.es5`.
  function CONST() {
  return (function(target) {
    return target;
  });
}

function CONST_EXPR(expr) {
  return expr;
}

function isPresent (x) {
  return !!x;
}

function isBlank (x) {
  return !x;
}

function isString(obj) {
  return typeof obj === 'string';
}

function isType (x) {
  return typeof x === 'function';
}

function isStringMap(obj) {
  return typeof obj === 'object' && obj !== null;
}

function isArray(obj) {
  return Array.isArray(obj);
}

function getTypeNameForDebugging (fn) {
  return fn.name || 'Root';
}

var PromiseWrapper = {
  resolve: function (reason) {
    return $q.when(reason);
  },

  reject: function (reason) {
    return $q.reject(reason);
  },

  catchError: function (promise, fn) {
    return promise.then(null, fn);
  },
  all: function (promises) {
    return $q.all(promises);
  }
};

var RegExpWrapper = {
  create: function(regExpStr, flags) {
    flags = flags ? flags.replace(/g/g, '') : '';
    return new RegExp(regExpStr, flags + 'g');
  },
  firstMatch: function(regExp, input) {
    regExp.lastIndex = 0;
    return regExp.exec(input);
  },
  matcher: function (regExp, input) {
    regExp.lastIndex = 0;
    return { re: regExp, input: input };
  }
};

var reflector = {
  annotations: function (fn) {
    //TODO: implement me
    return fn.annotations || [];
  }
};

var MapWrapper = {
  create: function() {
    return new Map();
  },

  get: function(m, k) {
    return m.get(k);
  },

  set: function(m, k, v) {
    return m.set(k, v);
  },

  contains: function (m, k) {
    return m.has(k);
  },

  forEach: function (m, fn) {
    return m.forEach(fn);
  }
};

var StringMapWrapper = {
  create: function () {
    return {};
  },

  set: function (m, k, v) {
    return m[k] = v;
  },

  get: function (m, k) {
    return m.hasOwnProperty(k) ? m[k] : undefined;
  },

  contains: function (m, k) {
    return m.hasOwnProperty(k);
  },

  keys: function(map) {
    return Object.keys(map);
  },

  isEmpty: function(map) {
    for (var prop in map) {
      if (map.hasOwnProperty(prop)) {
        return false;
      }
    }
    return true;
  },

  delete: function(map, key) {
    delete map[key];
  },

  forEach: function (m, fn) {
    for (var prop in m) {
      if (m.hasOwnProperty(prop)) {
        fn(m[prop], prop);
      }
    }
  },

  equals: function (m1, m2) {
    var k1 = Object.keys(m1);
    var k2 = Object.keys(m2);
    if (k1.length != k2.length) {
      return false;
    }
    var key;
    for (var i = 0; i < k1.length; i++) {
      key = k1[i];
      if (m1[key] !== m2[key]) {
        return false;
      }
    }
    return true;
  },

  merge: function(m1, m2) {
    var m = {};
    for (var attr in m1) {
      if (m1.hasOwnProperty(attr)) {
        m[attr] = m1[attr];
      }
    }
    for (var attr in m2) {
      if (m2.hasOwnProperty(attr)) {
        m[attr] = m2[attr];
      }
    }
    return m;
  }
};

var List = Array;
var ListWrapper = {
  toJSON: function(l) {
    return JSON.stringify(l);
  },

  clear: function (l) {
    l.length = 0;
  },

  create: function () {
    return [];
  },

  push: function (l, v) {
    return l.push(v);
  },

  forEach: function (l, fn) {
    return l.forEach(fn);
  },

  first: function(array) {
    if (!array)
      return null;
    return array[0];
  },

  last: function(array) {
    return (array && array.length) > 0 ? array[array.length - 1] : null;
  },

  map: function (l, fn) {
    return l.map(fn);
  },

  join: function (l, str) {
    return l.join(str);
  },

  reduce: function(list, fn, init) {
    return list.reduce(fn, init);
  },

  filter: function(array, pred) {
    return array.filter(pred);
  },

  concat: function(a, b) {
    return a.concat(b);
  },

  slice: function(l) {
    var from = arguments[1] !== (void 0) ? arguments[1] : 0;
    var to = arguments[2] !== (void 0) ? arguments[2] : null;
    return l.slice(from, to === null ? undefined : to);
  },

  maximum: function(list, predicate) {
    if (list.length == 0) {
      return null;
    }
    var solution = null;
    var maxValue = -Infinity;
    for (var index = 0; index < list.length; index++) {
      var candidate = list[index];
      if (isBlank(candidate)) {
        continue;
      }
      var candidateValue = predicate(candidate);
      if (candidateValue > maxValue) {
        solution = candidate;
        maxValue = candidateValue;
      }
    }
    return solution;
  }
};

var StringWrapper = {
  charCodeAt: function(s, i) {
    return s.charCodeAt(i);
  },

  equals: function (s1, s2) {
    return s1 === s2;
  },

  split: function(s, re) {
    return s.split(re);
  },

  replaceAll: function(s, from, replace) {
    return s.replace(from, replace);
  },

  replaceAllMapped: function(s, from, cb) {
    return s.replace(from, function(matches) {
      // Remove offset & string from the result array
      matches.splice(-2, 2);
      // The callback receives match, p1, ..., pn
      return cb.apply(null, matches);
    });
  },

  contains: function(s, substr) {
    return s.indexOf(substr) != -1;
  }

};

//TODO: implement?
// I think it's too heavy to ask 1.x users to bring in Rx for the router...
function EventEmitter() {}

var BaseException = Error;

var ObservableWrapper = {
  callNext: function(ob, val) {
    ob.fn(val);
  },
  callEmit: function(ob, val) {
    ob.fn(val);
  },

  subscribe: function(ob, fn) {
    ob.fn = fn;
  }
};

// TODO: https://github.com/angular/angular.js/blob/master/src/ng/browser.js#L227-L265
var $__router_47_location__ = {
  Location: Location
};

function Location(){}
Location.prototype.subscribe = function () {
  //TODO: implement
};
Location.prototype.path = function () {
  return $location.url();
};
Location.prototype.go = function (path, query) {
  return $location.url(path + query);
};
Location.prototype.prepareExternalUrl = function(url) {
  if (url.length > 0 && !url.startsWith('/')) {
    url = '/' + url;
  }
  return $location.$$html5 ? '.' + url : '#' + $locationHashPrefix + url;
};


  var exports = {
    Injectable: function () {},
    OpaqueToken: function () {},
    Inject: function () {}
  };
  var routerRequire = function () {return exports;};

  // When this file is processed, the line below is replaced with
  // the contents of the compiled TypeScript classes.
  var TouchMap = (function () {
    function TouchMap(map) {
        var _this = this;
        this.map = {};
        this.keys = {};
        if (isPresent(map)) {
            StringMapWrapper.forEach(map, function (value, key) {
                _this.map[key] = isPresent(value) ? value.toString() : null;
                _this.keys[key] = true;
            });
        }
    }
    TouchMap.prototype.get = function (key) {
        StringMapWrapper.delete(this.keys, key);
        return this.map[key];
    };
    TouchMap.prototype.getUnused = function () {
        var _this = this;
        var unused = {};
        var keys = StringMapWrapper.keys(this.keys);
        keys.forEach(function (key) { return unused[key] = StringMapWrapper.get(_this.map, key); });
        return unused;
    };
    return TouchMap;
})();
exports.TouchMap = TouchMap;
function normalizeString(obj) {
    if (isBlank(obj)) {
        return null;
    }
    else {
        return obj.toString();
    }
}
exports.normalizeString = normalizeString;
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function convertUrlParamsToArray(urlParams) {
    var paramsArray = [];
    if (isBlank(urlParams)) {
        return [];
    }
    StringMapWrapper.forEach(urlParams, function (value, key) { paramsArray.push((value === true) ? key : key + '=' + value); });
    return paramsArray;
}
exports.convertUrlParamsToArray = convertUrlParamsToArray;
// Convert an object of url parameters into a string that can be used in an URL
function serializeParams(urlParams, joiner) {
    if (joiner === void 0) { joiner = '&'; }
    return convertUrlParamsToArray(urlParams).join(joiner);
}
exports.serializeParams = serializeParams;
/**
 * This class represents a parsed URL
 */
var Url = (function () {
    function Url(path, child, auxiliary, params) {
        if (child === void 0) { child = null; }
        if (auxiliary === void 0) { auxiliary = CONST_EXPR([]); }
        if (params === void 0) { params = CONST_EXPR({}); }
        this.path = path;
        this.child = child;
        this.auxiliary = auxiliary;
        this.params = params;
    }
    Url.prototype.toString = function () {
        return this.path + this._matrixParamsToString() + this._auxToString() + this._childString();
    };
    Url.prototype.segmentToString = function () { return this.path + this._matrixParamsToString(); };
    /** @internal */
    Url.prototype._auxToString = function () {
        return this.auxiliary.length > 0 ?
            ('(' + this.auxiliary.map(function (sibling) { return sibling.toString(); }).join('//') + ')') :
            '';
    };
    Url.prototype._matrixParamsToString = function () {
        var paramString = serializeParams(this.params, ';');
        if (paramString.length > 0) {
            return ';' + paramString;
        }
        return '';
    };
    /** @internal */
    Url.prototype._childString = function () { return isPresent(this.child) ? ('/' + this.child.toString()) : ''; };
    return Url;
})();
exports.Url = Url;
var RootUrl = (function (_super) {
    __extends(RootUrl, _super);
    function RootUrl(path, child, auxiliary, params) {
        if (child === void 0) { child = null; }
        if (auxiliary === void 0) { auxiliary = CONST_EXPR([]); }
        if (params === void 0) { params = null; }
        _super.call(this, path, child, auxiliary, params);
    }
    RootUrl.prototype.toString = function () {
        return this.path + this._auxToString() + this._childString() + this._queryParamsToString();
    };
    RootUrl.prototype.segmentToString = function () { return this.path + this._queryParamsToString(); };
    RootUrl.prototype._queryParamsToString = function () {
        if (isBlank(this.params)) {
            return '';
        }
        return '?' + serializeParams(this.params);
    };
    return RootUrl;
})(Url);
exports.RootUrl = RootUrl;
function pathSegmentsToUrl(pathSegments) {
    var url = new Url(pathSegments[pathSegments.length - 1]);
    for (var i = pathSegments.length - 2; i >= 0; i -= 1) {
        url = new Url(pathSegments[i], url);
    }
    return url;
}
exports.pathSegmentsToUrl = pathSegmentsToUrl;
var SEGMENT_RE = RegExpWrapper.create('^[^\\/\\(\\)\\?;=&#]+');
function matchUrlSegment(str) {
    var match = RegExpWrapper.firstMatch(SEGMENT_RE, str);
    return isPresent(match) ? match[0] : '';
}
var QUERY_PARAM_VALUE_RE = RegExpWrapper.create('^[^\\(\\)\\?;&#]+');
function matchUrlQueryParamValue(str) {
    var match = RegExpWrapper.firstMatch(QUERY_PARAM_VALUE_RE, str);
    return isPresent(match) ? match[0] : '';
}
var UrlParser = (function () {
    function UrlParser() {
    }
    UrlParser.prototype.peekStartsWith = function (str) { return this._remaining.startsWith(str); };
    UrlParser.prototype.capture = function (str) {
        if (!this._remaining.startsWith(str)) {
            throw new BaseException("Expected \"" + str + "\".");
        }
        this._remaining = this._remaining.substring(str.length);
    };
    UrlParser.prototype.parse = function (url) {
        this._remaining = url;
        if (url == '' || url == '/') {
            return new Url('');
        }
        return this.parseRoot();
    };
    // segment + (aux segments) + (query params)
    UrlParser.prototype.parseRoot = function () {
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this._remaining);
        this.capture(path);
        var aux = [];
        if (this.peekStartsWith('(')) {
            aux = this.parseAuxiliaryRoutes();
        }
        if (this.peekStartsWith(';')) {
            // TODO: should these params just be dropped?
            this.parseMatrixParams();
        }
        var child = null;
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            child = this.parseSegment();
        }
        var queryParams = null;
        if (this.peekStartsWith('?')) {
            queryParams = this.parseQueryParams();
        }
        return new RootUrl(path, child, aux, queryParams);
    };
    // segment + (matrix params) + (aux segments)
    UrlParser.prototype.parseSegment = function () {
        if (this._remaining.length == 0) {
            return null;
        }
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this._remaining);
        this.capture(path);
        var matrixParams = null;
        if (this.peekStartsWith(';')) {
            matrixParams = this.parseMatrixParams();
        }
        var aux = [];
        if (this.peekStartsWith('(')) {
            aux = this.parseAuxiliaryRoutes();
        }
        var child = null;
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            child = this.parseSegment();
        }
        return new Url(path, child, aux, matrixParams);
    };
    UrlParser.prototype.parseQueryParams = function () {
        var params = {};
        this.capture('?');
        this.parseQueryParam(params);
        while (this._remaining.length > 0 && this.peekStartsWith('&')) {
            this.capture('&');
            this.parseQueryParam(params);
        }
        return params;
    };
    UrlParser.prototype.parseMatrixParams = function () {
        var params = {};
        while (this._remaining.length > 0 && this.peekStartsWith(';')) {
            this.capture(';');
            this.parseParam(params);
        }
        return params;
    };
    UrlParser.prototype.parseParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = true;
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlSegment(this._remaining);
            if (isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseQueryParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = true;
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlQueryParamValue(this._remaining);
            if (isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    UrlParser.prototype.parseAuxiliaryRoutes = function () {
        var routes = [];
        this.capture('(');
        while (!this.peekStartsWith(')') && this._remaining.length > 0) {
            routes.push(this.parseSegment());
            if (this.peekStartsWith('//')) {
                this.capture('//');
            }
        }
        this.capture(')');
        return routes;
    };
    return UrlParser;
})();
exports.UrlParser = UrlParser;
exports.parser = new UrlParser();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RouteLifecycleHook = (function () {
    function RouteLifecycleHook(name) {
        this.name = name;
    }
    RouteLifecycleHook = __decorate([
        CONST()
    ], RouteLifecycleHook);
    return RouteLifecycleHook;
})();
exports.RouteLifecycleHook = RouteLifecycleHook;
var CanActivate = (function () {
    function CanActivate(fn) {
        this.fn = fn;
    }
    CanActivate = __decorate([
        CONST()
    ], CanActivate);
    return CanActivate;
})();
exports.CanActivate = CanActivate;
exports.routerCanReuse = CONST_EXPR(new RouteLifecycleHook("routerCanReuse"));
exports.routerCanDeactivate = CONST_EXPR(new RouteLifecycleHook("routerCanDeactivate"));
exports.routerOnActivate = CONST_EXPR(new RouteLifecycleHook("routerOnActivate"));
exports.routerOnReuse = CONST_EXPR(new RouteLifecycleHook("routerOnReuse"));
exports.routerOnDeactivate = CONST_EXPR(new RouteLifecycleHook("routerOnDeactivate"));
var lifecycle_annotations_impl_1 = routerRequire('./lifecycle_annotations_impl');
function hasLifecycleHook(e, type) {
    if (!(type instanceof Type))
        return false;
    return e.name in type.prototype;
}
exports.hasLifecycleHook = hasLifecycleHook;
function getCanActivateHook(type) {
    var annotations = reflector.annotations(type);
    for (var i = 0; i < annotations.length; i += 1) {
        var annotation = annotations[i];
        if (annotation instanceof lifecycle_annotations_impl_1.CanActivate) {
            return annotation.fn;
        }
    }
    return null;
}
exports.getCanActivateHook = getCanActivateHook;
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var route_definition_1 = routerRequire('../route_definition');
exports.RouteDefinition = route_definition_1.RouteDefinition;
var __make_dart_analyzer_happy = null;
/**
 * The `RouteConfig` decorator defines routes for a given component.
 *
 * It takes an array of {@link RouteDefinition}s.
 */
var RouteConfig = (function () {
    function RouteConfig(configs) {
        this.configs = configs;
    }
    RouteConfig = __decorate([
        CONST()
    ], RouteConfig);
    return RouteConfig;
})();
exports.RouteConfig = RouteConfig;
var AbstractRoute = (function () {
    function AbstractRoute(_a) {
        var name = _a.name, useAsDefault = _a.useAsDefault, path = _a.path, regex = _a.regex, serializer = _a.serializer, data = _a.data;
        this.name = name;
        this.useAsDefault = useAsDefault;
        this.path = path;
        this.regex = regex;
        this.serializer = serializer;
        this.data = data;
    }
    AbstractRoute = __decorate([
        CONST()
    ], AbstractRoute);
    return AbstractRoute;
})();
exports.AbstractRoute = AbstractRoute;
/**
 * `Route` is a type of {@link RouteDefinition} used to route a path to a component.
 *
 * It has the following properties:
 * - `path` is a string that uses the route matcher DSL.
 * - `component` a component type.
 * - `name` is an optional `CamelCase` string representing the name of the route.
 * - `data` is an optional property of any type representing arbitrary route metadata for the given
 * route. It is injectable via {@link RouteData}.
 * - `useAsDefault` is a boolean value. If `true`, the child route will be navigated to if no child
 * route is specified during the navigation.
 *
 * ### Example
 * ```
 * import {RouteConfig, Route} from 'angular2/router';
 *
 * @RouteConfig([
 *   new Route({path: '/home', component: HomeCmp, name: 'HomeCmp' })
 * ])
 * class MyApp {}
 * ```
 */
var Route = (function (_super) {
    __extends(Route, _super);
    function Route(_a) {
        var name = _a.name, useAsDefault = _a.useAsDefault, path = _a.path, regex = _a.regex, serializer = _a.serializer, data = _a.data, component = _a.component;
        _super.call(this, {
            name: name,
            useAsDefault: useAsDefault,
            path: path,
            regex: regex,
            serializer: serializer,
            data: data
        });
        this.aux = null;
        this.component = component;
    }
    Route = __decorate([
        CONST()
    ], Route);
    return Route;
})(AbstractRoute);
exports.Route = Route;
/**
 * `AuxRoute` is a type of {@link RouteDefinition} used to define an auxiliary route.
 *
 * It takes an object with the following properties:
 * - `path` is a string that uses the route matcher DSL.
 * - `component` a component type.
 * - `name` is an optional `CamelCase` string representing the name of the route.
 * - `data` is an optional property of any type representing arbitrary route metadata for the given
 * route. It is injectable via {@link RouteData}.
 *
 * ### Example
 * ```
 * import {RouteConfig, AuxRoute} from 'angular2/router';
 *
 * @RouteConfig([
 *   new AuxRoute({path: '/home', component: HomeCmp})
 * ])
 * class MyApp {}
 * ```
 */
var AuxRoute = (function (_super) {
    __extends(AuxRoute, _super);
    function AuxRoute(_a) {
        var name = _a.name, useAsDefault = _a.useAsDefault, path = _a.path, regex = _a.regex, serializer = _a.serializer, data = _a.data, component = _a.component;
        _super.call(this, {
            name: name,
            useAsDefault: useAsDefault,
            path: path,
            regex: regex,
            serializer: serializer,
            data: data
        });
        this.component = component;
    }
    AuxRoute = __decorate([
        CONST()
    ], AuxRoute);
    return AuxRoute;
})(AbstractRoute);
exports.AuxRoute = AuxRoute;
/**
 * `AsyncRoute` is a type of {@link RouteDefinition} used to route a path to an asynchronously
 * loaded component.
 *
 * It has the following properties:
 * - `path` is a string that uses the route matcher DSL.
 * - `loader` is a function that returns a promise that resolves to a component.
 * - `name` is an optional `CamelCase` string representing the name of the route.
 * - `data` is an optional property of any type representing arbitrary route metadata for the given
 * route. It is injectable via {@link RouteData}.
 * - `useAsDefault` is a boolean value. If `true`, the child route will be navigated to if no child
 * route is specified during the navigation.
 *
 * ### Example
 * ```
 * import {RouteConfig, AsyncRoute} from 'angular2/router';
 *
 * @RouteConfig([
 *   new AsyncRoute({path: '/home', loader: () => Promise.resolve(MyLoadedCmp), name:
 * 'MyLoadedCmp'})
 * ])
 * class MyApp {}
 * ```
 */
var AsyncRoute = (function (_super) {
    __extends(AsyncRoute, _super);
    function AsyncRoute(_a) {
        var name = _a.name, useAsDefault = _a.useAsDefault, path = _a.path, regex = _a.regex, serializer = _a.serializer, data = _a.data, loader = _a.loader;
        _super.call(this, {
            name: name,
            useAsDefault: useAsDefault,
            path: path,
            regex: regex,
            serializer: serializer,
            data: data
        });
        this.aux = null;
        this.loader = loader;
    }
    AsyncRoute = __decorate([
        CONST()
    ], AsyncRoute);
    return AsyncRoute;
})(AbstractRoute);
exports.AsyncRoute = AsyncRoute;
/**
 * `Redirect` is a type of {@link RouteDefinition} used to route a path to a canonical route.
 *
 * It has the following properties:
 * - `path` is a string that uses the route matcher DSL.
 * - `redirectTo` is an array representing the link DSL.
 *
 * Note that redirects **do not** affect how links are generated. For that, see the `useAsDefault`
 * option.
 *
 * ### Example
 * ```
 * import {RouteConfig, Route, Redirect} from 'angular2/router';
 *
 * @RouteConfig([
 *   new Redirect({path: '/', redirectTo: ['/Home'] }),
 *   new Route({path: '/home', component: HomeCmp, name: 'Home'})
 * ])
 * class MyApp {}
 * ```
 */
var Redirect = (function (_super) {
    __extends(Redirect, _super);
    function Redirect(_a) {
        var name = _a.name, useAsDefault = _a.useAsDefault, path = _a.path, regex = _a.regex, serializer = _a.serializer, data = _a.data, redirectTo = _a.redirectTo;
        _super.call(this, {
            name: name,
            useAsDefault: useAsDefault,
            path: path,
            regex: regex,
            serializer: serializer,
            data: data
        });
        this.redirectTo = redirectTo;
    }
    Redirect = __decorate([
        CONST()
    ], Redirect);
    return Redirect;
})(AbstractRoute);
exports.Redirect = Redirect;
var route_config_decorator_1 = routerRequire('./route_config_decorator');
/**
 * Given a JS Object that represents a route config, returns a corresponding Route, AsyncRoute,
 * AuxRoute or Redirect object.
 *
 * Also wraps an AsyncRoute's loader function to add the loaded component's route config to the
 * `RouteRegistry`.
 */
function normalizeRouteConfig(config, registry) {
    if (config instanceof route_config_decorator_1.AsyncRoute) {
        var wrappedLoader = wrapLoaderToReconfigureRegistry(config.loader, registry);
        return new route_config_decorator_1.AsyncRoute({
            path: config.path,
            loader: wrappedLoader,
            name: config.name,
            data: config.data,
            useAsDefault: config.useAsDefault
        });
    }
    if (config instanceof route_config_decorator_1.Route || config instanceof route_config_decorator_1.Redirect || config instanceof route_config_decorator_1.AuxRoute) {
        return config;
    }
    if ((+!!config.component) + (+!!config.redirectTo) + (+!!config.loader) != 1) {
        throw new BaseException("Route config should contain exactly one \"component\", \"loader\", or \"redirectTo\" property.");
    }
    if (config.as && config.name) {
        throw new BaseException("Route config should contain exactly one \"as\" or \"name\" property.");
    }
    if (config.as) {
        config.name = config.as;
    }
    if (config.loader) {
        var wrappedLoader = wrapLoaderToReconfigureRegistry(config.loader, registry);
        return new route_config_decorator_1.AsyncRoute({
            path: config.path,
            loader: wrappedLoader,
            name: config.name,
            data: config.data,
            useAsDefault: config.useAsDefault
        });
    }
    if (config.aux) {
        return new route_config_decorator_1.AuxRoute({ path: config.aux, component: config.component, name: config.name });
    }
    if (config.component) {
        if (typeof config.component == 'object') {
            var componentDefinitionObject = config.component;
            if (componentDefinitionObject.type == 'constructor') {
                return new route_config_decorator_1.Route({
                    path: config.path,
                    component: componentDefinitionObject.constructor,
                    name: config.name,
                    data: config.data,
                    useAsDefault: config.useAsDefault
                });
            }
            else if (componentDefinitionObject.type == 'loader') {
                return new route_config_decorator_1.AsyncRoute({
                    path: config.path,
                    loader: componentDefinitionObject.loader,
                    name: config.name,
                    data: config.data,
                    useAsDefault: config.useAsDefault
                });
            }
            else {
                throw new BaseException("Invalid component type \"" + componentDefinitionObject.type + "\". Valid types are \"constructor\" and \"loader\".");
            }
        }
        return new route_config_decorator_1.Route(config);
    }
    if (config.redirectTo) {
        return new route_config_decorator_1.Redirect({ path: config.path, redirectTo: config.redirectTo });
    }
    return config;
}
exports.normalizeRouteConfig = normalizeRouteConfig;
function wrapLoaderToReconfigureRegistry(loader, registry) {
    return function () {
        return loader().then(function (componentType) {
            registry.configFromComponent(componentType);
            return componentType;
        });
    };
}
function assertComponentExists(component, path) {
    if (!isType(component)) {
        throw new BaseException("Component for route \"" + path + "\" is not defined, or is not a class.");
    }
}
exports.assertComponentExists = assertComponentExists;
var instruction_1 = routerRequire('../../instruction');
var AsyncRouteHandler = (function () {
    function AsyncRouteHandler(_loader, data) {
        if (data === void 0) { data = null; }
        this._loader = _loader;
        /** @internal */
        this._resolvedComponent = null;
        this.data = isPresent(data) ? new instruction_1.RouteData(data) : instruction_1.BLANK_ROUTE_DATA;
    }
    AsyncRouteHandler.prototype.resolveComponentType = function () {
        var _this = this;
        if (isPresent(this._resolvedComponent)) {
            return this._resolvedComponent;
        }
        return this._resolvedComponent = this._loader().then(function (componentType) {
            _this.componentType = componentType;
            return componentType;
        });
    };
    return AsyncRouteHandler;
})();
exports.AsyncRouteHandler = AsyncRouteHandler;
var instruction_1 = routerRequire('../../instruction');
var SyncRouteHandler = (function () {
    function SyncRouteHandler(componentType, data) {
        this.componentType = componentType;
        /** @internal */
        this._resolvedComponent = null;
        this._resolvedComponent = PromiseWrapper.resolve(componentType);
        this.data = isPresent(data) ? new instruction_1.RouteData(data) : instruction_1.BLANK_ROUTE_DATA;
    }
    SyncRouteHandler.prototype.resolveComponentType = function () { return this._resolvedComponent; };
    return SyncRouteHandler;
})();
exports.SyncRouteHandler = SyncRouteHandler;
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var url_parser_1 = routerRequire('../url_parser');
var instruction_1 = routerRequire('../instruction');
// RouteMatch objects hold information about a match between a rule and a URL
var RouteMatch = (function () {
    function RouteMatch() {
    }
    return RouteMatch;
})();
exports.RouteMatch = RouteMatch;
var PathMatch = (function (_super) {
    __extends(PathMatch, _super);
    function PathMatch(instruction, remaining, remainingAux) {
        _super.call(this);
        this.instruction = instruction;
        this.remaining = remaining;
        this.remainingAux = remainingAux;
    }
    return PathMatch;
})(RouteMatch);
exports.PathMatch = PathMatch;
var RedirectMatch = (function (_super) {
    __extends(RedirectMatch, _super);
    function RedirectMatch(redirectTo, specificity) {
        _super.call(this);
        this.redirectTo = redirectTo;
        this.specificity = specificity;
    }
    return RedirectMatch;
})(RouteMatch);
exports.RedirectMatch = RedirectMatch;
var RedirectRule = (function () {
    function RedirectRule(_pathRecognizer, redirectTo) {
        this._pathRecognizer = _pathRecognizer;
        this.redirectTo = redirectTo;
        this.hash = this._pathRecognizer.hash;
    }
    Object.defineProperty(RedirectRule.prototype, "path", {
        get: function () { return this._pathRecognizer.toString(); },
        set: function (val) { throw new BaseException('you cannot set the path of a RedirectRule directly'); },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns `null` or a `ParsedUrl` representing the new path to match
     */
    RedirectRule.prototype.recognize = function (beginningSegment) {
        var match = null;
        if (isPresent(this._pathRecognizer.matchUrl(beginningSegment))) {
            match = new RedirectMatch(this.redirectTo, this._pathRecognizer.specificity);
        }
        return PromiseWrapper.resolve(match);
    };
    RedirectRule.prototype.generate = function (params) {
        throw new BaseException("Tried to generate a redirect.");
    };
    return RedirectRule;
})();
exports.RedirectRule = RedirectRule;
// represents something like '/foo/:bar'
var RouteRule = (function () {
    // TODO: cache component instruction instances by params and by ParsedUrl instance
    function RouteRule(_routePath, handler, _routeName) {
        this._routePath = _routePath;
        this.handler = handler;
        this._routeName = _routeName;
        this._cache = new Map();
        this.specificity = this._routePath.specificity;
        this.hash = this._routePath.hash;
        this.terminal = this._routePath.terminal;
    }
    Object.defineProperty(RouteRule.prototype, "path", {
        get: function () { return this._routePath.toString(); },
        set: function (val) { throw new BaseException('you cannot set the path of a RouteRule directly'); },
        enumerable: true,
        configurable: true
    });
    RouteRule.prototype.recognize = function (beginningSegment) {
        var _this = this;
        var res = this._routePath.matchUrl(beginningSegment);
        if (isBlank(res)) {
            return null;
        }
        return this.handler.resolveComponentType().then(function (_) {
            var componentInstruction = _this._getInstruction(res.urlPath, res.urlParams, res.allParams);
            return new PathMatch(componentInstruction, res.rest, res.auxiliary);
        });
    };
    RouteRule.prototype.generate = function (params) {
        var generated = this._routePath.generateUrl(params);
        var urlPath = generated.urlPath;
        var urlParams = generated.urlParams;
        return this._getInstruction(urlPath, url_parser_1.convertUrlParamsToArray(urlParams), params);
    };
    RouteRule.prototype.generateComponentPathValues = function (params) {
        return this._routePath.generateUrl(params);
    };
    RouteRule.prototype._getInstruction = function (urlPath, urlParams, params) {
        if (isBlank(this.handler.componentType)) {
            throw new BaseException("Tried to get instruction before the type was loaded.");
        }
        var hashKey = urlPath + '?' + urlParams.join('&');
        if (this._cache.has(hashKey)) {
            return this._cache.get(hashKey);
        }
        var instruction = new instruction_1.ComponentInstruction(urlPath, urlParams, this.handler.data, this.handler.componentType, this.terminal, this.specificity, params, this._routeName);
        this._cache.set(hashKey, instruction);
        return instruction;
    };
    return RouteRule;
})();
exports.RouteRule = RouteRule;
var rules_1 = routerRequire('./rules');
var route_config_impl_1 = routerRequire('../route_config/route_config_impl');
var async_route_handler_1 = routerRequire('./route_handlers/async_route_handler');
var sync_route_handler_1 = routerRequire('./route_handlers/sync_route_handler');
var param_route_path_1 = routerRequire('./route_paths/param_route_path');
var regex_route_path_1 = routerRequire('./route_paths/regex_route_path');
/**
 * A `RuleSet` is responsible for recognizing routes for a particular component.
 * It is consumed by `RouteRegistry`, which knows how to recognize an entire hierarchy of
 * components.
 */
var RuleSet = (function () {
    function RuleSet() {
        this.rulesByName = new Map();
        // map from name to rule
        this.auxRulesByName = new Map();
        // map from starting path to rule
        this.auxRulesByPath = new Map();
        // TODO: optimize this into a trie
        this.rules = [];
        // the rule to use automatically when recognizing or generating from this rule set
        this.defaultRule = null;
    }
    /**
     * Configure additional rules in this rule set from a route definition
     * @returns {boolean} true if the config is terminal
     */
    RuleSet.prototype.config = function (config) {
        var handler;
        if (isPresent(config.name) && config.name[0].toUpperCase() != config.name[0]) {
            var suggestedName = config.name[0].toUpperCase() + config.name.substring(1);
            throw new BaseException("Route \"" + config.path + "\" with name \"" + config.name + "\" does not begin with an uppercase letter. Route names should be CamelCase like \"" + suggestedName + "\".");
        }
        if (config instanceof route_config_impl_1.AuxRoute) {
            handler = new sync_route_handler_1.SyncRouteHandler(config.component, config.data);
            var routePath_1 = this._getRoutePath(config);
            var auxRule = new rules_1.RouteRule(routePath_1, handler, config.name);
            this.auxRulesByPath.set(routePath_1.toString(), auxRule);
            if (isPresent(config.name)) {
                this.auxRulesByName.set(config.name, auxRule);
            }
            return auxRule.terminal;
        }
        var useAsDefault = false;
        if (config instanceof route_config_impl_1.Redirect) {
            var routePath_2 = this._getRoutePath(config);
            var redirector = new rules_1.RedirectRule(routePath_2, config.redirectTo);
            this._assertNoHashCollision(redirector.hash, config.path);
            this.rules.push(redirector);
            return true;
        }
        if (config instanceof route_config_impl_1.Route) {
            handler = new sync_route_handler_1.SyncRouteHandler(config.component, config.data);
            useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
        }
        else if (config instanceof route_config_impl_1.AsyncRoute) {
            handler = new async_route_handler_1.AsyncRouteHandler(config.loader, config.data);
            useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
        }
        var routePath = this._getRoutePath(config);
        var newRule = new rules_1.RouteRule(routePath, handler, config.name);
        this._assertNoHashCollision(newRule.hash, config.path);
        if (useAsDefault) {
            if (isPresent(this.defaultRule)) {
                throw new BaseException("Only one route can be default");
            }
            this.defaultRule = newRule;
        }
        this.rules.push(newRule);
        if (isPresent(config.name)) {
            this.rulesByName.set(config.name, newRule);
        }
        return newRule.terminal;
    };
    /**
     * Given a URL, returns a list of `RouteMatch`es, which are partial recognitions for some route.
     */
    RuleSet.prototype.recognize = function (urlParse) {
        var solutions = [];
        this.rules.forEach(function (routeRecognizer) {
            var pathMatch = routeRecognizer.recognize(urlParse);
            if (isPresent(pathMatch)) {
                solutions.push(pathMatch);
            }
        });
        // handle cases where we are routing just to an aux route
        if (solutions.length == 0 && isPresent(urlParse) && urlParse.auxiliary.length > 0) {
            return [PromiseWrapper.resolve(new rules_1.PathMatch(null, null, urlParse.auxiliary))];
        }
        return solutions;
    };
    RuleSet.prototype.recognizeAuxiliary = function (urlParse) {
        var routeRecognizer = this.auxRulesByPath.get(urlParse.path);
        if (isPresent(routeRecognizer)) {
            return [routeRecognizer.recognize(urlParse)];
        }
        return [PromiseWrapper.resolve(null)];
    };
    RuleSet.prototype.hasRoute = function (name) { return this.rulesByName.has(name); };
    RuleSet.prototype.componentLoaded = function (name) {
        return this.hasRoute(name) && isPresent(this.rulesByName.get(name).handler.componentType);
    };
    RuleSet.prototype.loadComponent = function (name) {
        return this.rulesByName.get(name).handler.resolveComponentType();
    };
    RuleSet.prototype.generate = function (name, params) {
        var rule = this.rulesByName.get(name);
        if (isBlank(rule)) {
            return null;
        }
        return rule.generate(params);
    };
    RuleSet.prototype.generateAuxiliary = function (name, params) {
        var rule = this.auxRulesByName.get(name);
        if (isBlank(rule)) {
            return null;
        }
        return rule.generate(params);
    };
    RuleSet.prototype._assertNoHashCollision = function (hash, path) {
        this.rules.forEach(function (rule) {
            if (hash == rule.hash) {
                throw new BaseException("Configuration '" + path + "' conflicts with existing route '" + rule.path + "'");
            }
        });
    };
    RuleSet.prototype._getRoutePath = function (config) {
        if (isPresent(config.regex)) {
            if (isFunction(config.serializer)) {
                return new regex_route_path_1.RegexRoutePath(config.regex, config.serializer);
            }
            else {
                throw new BaseException("Route provides a regex property, '" + config.regex + "', but no serializer property");
            }
        }
        if (isPresent(config.path)) {
            // Auxiliary routes do not have a slash at the start
            var path = (config instanceof route_config_impl_1.AuxRoute && config.path.startsWith('/')) ?
                config.path.substring(1) :
                config.path;
            return new param_route_path_1.ParamRoutePath(path);
        }
        throw new BaseException('Route must provide either a path or regex property');
    };
    return RuleSet;
})();
exports.RuleSet = RuleSet;
var MatchedUrl = (function () {
    function MatchedUrl(urlPath, urlParams, allParams, auxiliary, rest) {
        this.urlPath = urlPath;
        this.urlParams = urlParams;
        this.allParams = allParams;
        this.auxiliary = auxiliary;
        this.rest = rest;
    }
    return MatchedUrl;
})();
exports.MatchedUrl = MatchedUrl;
var GeneratedUrl = (function () {
    function GeneratedUrl(urlPath, urlParams) {
        this.urlPath = urlPath;
        this.urlParams = urlParams;
    }
    return GeneratedUrl;
})();
exports.GeneratedUrl = GeneratedUrl;
var utils_1 = routerRequire('../../utils');
var url_parser_1 = routerRequire('../../url_parser');
var route_path_1 = routerRequire('./route_path');
/**
 * Identified by a `...` URL segment. This indicates that the
 * Route will continue to be matched by child `Router`s.
 */
var ContinuationPathSegment = (function () {
    function ContinuationPathSegment() {
        this.name = '';
        this.specificity = '';
        this.hash = '...';
    }
    ContinuationPathSegment.prototype.generate = function (params) { return ''; };
    ContinuationPathSegment.prototype.match = function (path) { return true; };
    return ContinuationPathSegment;
})();
/**
 * Identified by a string not starting with a `:` or `*`.
 * Only matches the URL segments that equal the segment path
 */
var StaticPathSegment = (function () {
    function StaticPathSegment(path) {
        this.path = path;
        this.name = '';
        this.specificity = '2';
        this.hash = path;
    }
    StaticPathSegment.prototype.match = function (path) { return path == this.path; };
    StaticPathSegment.prototype.generate = function (params) { return this.path; };
    return StaticPathSegment;
})();
/**
 * Identified by a string starting with `:`. Indicates a segment
 * that can contain a value that will be extracted and provided to
 * a matching `Instruction`.
 */
var DynamicPathSegment = (function () {
    function DynamicPathSegment(name) {
        this.name = name;
        this.specificity = '1';
        this.hash = ':';
    }
    DynamicPathSegment.prototype.match = function (path) { return path.length > 0; };
    DynamicPathSegment.prototype.generate = function (params) {
        if (!StringMapWrapper.contains(params.map, this.name)) {
            throw new BaseException("Route generator for '" + this.name + "' was not included in parameters passed.");
        }
        return encodeDynamicSegment(utils_1.normalizeString(params.get(this.name)));
    };
    DynamicPathSegment.paramMatcher = /^:([^\/]+)$/g;
    return DynamicPathSegment;
})();
/**
 * Identified by a string starting with `*` Indicates that all the following
 * segments match this route and that the value of these segments should
 * be provided to a matching `Instruction`.
 */
var StarPathSegment = (function () {
    function StarPathSegment(name) {
        this.name = name;
        this.specificity = '0';
        this.hash = '*';
    }
    StarPathSegment.prototype.match = function (path) { return true; };
    StarPathSegment.prototype.generate = function (params) { return utils_1.normalizeString(params.get(this.name)); };
    StarPathSegment.wildcardMatcher = /^\*([^\/]+)$/g;
    return StarPathSegment;
})();
/**
 * Parses a URL string using a given matcher DSL, and generates URLs from param maps
 */
var ParamRoutePath = (function () {
    /**
     * Takes a string representing the matcher DSL
     */
    function ParamRoutePath(routePath) {
        this.routePath = routePath;
        this.terminal = true;
        this._assertValidPath(routePath);
        this._parsePathString(routePath);
        this.specificity = this._calculateSpecificity();
        this.hash = this._calculateHash();
        var lastSegment = this._segments[this._segments.length - 1];
        this.terminal = !(lastSegment instanceof ContinuationPathSegment);
    }
    ParamRoutePath.prototype.matchUrl = function (url) {
        var nextUrlSegment = url;
        var currentUrlSegment;
        var positionalParams = {};
        var captured = [];
        for (var i = 0; i < this._segments.length; i += 1) {
            var pathSegment = this._segments[i];
            currentUrlSegment = nextUrlSegment;
            if (pathSegment instanceof ContinuationPathSegment) {
                break;
            }
            if (isPresent(currentUrlSegment)) {
                // the star segment consumes all of the remaining URL, including matrix params
                if (pathSegment instanceof StarPathSegment) {
                    positionalParams[pathSegment.name] = currentUrlSegment.toString();
                    captured.push(currentUrlSegment.toString());
                    nextUrlSegment = null;
                    break;
                }
                captured.push(currentUrlSegment.path);
                if (pathSegment instanceof DynamicPathSegment) {
                    positionalParams[pathSegment.name] = decodeDynamicSegment(currentUrlSegment.path);
                }
                else if (!pathSegment.match(currentUrlSegment.path)) {
                    return null;
                }
                nextUrlSegment = currentUrlSegment.child;
            }
            else if (!pathSegment.match('')) {
                return null;
            }
        }
        if (this.terminal && isPresent(nextUrlSegment)) {
            return null;
        }
        var urlPath = captured.join('/');
        var auxiliary = [];
        var urlParams = [];
        var allParams = positionalParams;
        if (isPresent(currentUrlSegment)) {
            // If this is the root component, read query params. Otherwise, read matrix params.
            var paramsSegment = url instanceof url_parser_1.RootUrl ? url : currentUrlSegment;
            if (isPresent(paramsSegment.params)) {
                allParams = StringMapWrapper.merge(paramsSegment.params, positionalParams);
                urlParams = url_parser_1.convertUrlParamsToArray(paramsSegment.params);
            }
            else {
                allParams = positionalParams;
            }
            auxiliary = currentUrlSegment.auxiliary;
        }
        return new route_path_1.MatchedUrl(urlPath, urlParams, allParams, auxiliary, nextUrlSegment);
    };
    ParamRoutePath.prototype.generateUrl = function (params) {
        var paramTokens = new utils_1.TouchMap(params);
        var path = [];
        for (var i = 0; i < this._segments.length; i++) {
            var segment = this._segments[i];
            if (!(segment instanceof ContinuationPathSegment)) {
                path.push(segment.generate(paramTokens));
            }
        }
        var urlPath = path.join('/');
        var nonPositionalParams = paramTokens.getUnused();
        var urlParams = nonPositionalParams;
        return new route_path_1.GeneratedUrl(urlPath, urlParams);
    };
    ParamRoutePath.prototype.toString = function () { return this.routePath; };
    ParamRoutePath.prototype._parsePathString = function (routePath) {
        // normalize route as not starting with a "/". Recognition will
        // also normalize.
        if (routePath.startsWith("/")) {
            routePath = routePath.substring(1);
        }
        var segmentStrings = routePath.split('/');
        this._segments = [];
        var limit = segmentStrings.length - 1;
        for (var i = 0; i <= limit; i++) {
            var segment = segmentStrings[i], match;
            if (isPresent(match = RegExpWrapper.firstMatch(DynamicPathSegment.paramMatcher, segment))) {
                this._segments.push(new DynamicPathSegment(match[1]));
            }
            else if (isPresent(match = RegExpWrapper.firstMatch(StarPathSegment.wildcardMatcher, segment))) {
                this._segments.push(new StarPathSegment(match[1]));
            }
            else if (segment == '...') {
                if (i < limit) {
                    throw new BaseException("Unexpected \"...\" before the end of the path for \"" + routePath + "\".");
                }
                this._segments.push(new ContinuationPathSegment());
            }
            else {
                this._segments.push(new StaticPathSegment(segment));
            }
        }
    };
    ParamRoutePath.prototype._calculateSpecificity = function () {
        // The "specificity" of a path is used to determine which route is used when multiple routes
        // match
        // a URL. Static segments (like "/foo") are the most specific, followed by dynamic segments
        // (like
        // "/:id"). Star segments add no specificity. Segments at the start of the path are more
        // specific
        // than proceeding ones.
        //
        // The code below uses place values to combine the different types of segments into a single
        // string that we can sort later. Each static segment is marked as a specificity of "2," each
        // dynamic segment is worth "1" specificity, and stars are worth "0" specificity.
        var i, length = this._segments.length, specificity;
        if (length == 0) {
            // a single slash (or "empty segment" is as specific as a static segment
            specificity += '2';
        }
        else {
            specificity = '';
            for (i = 0; i < length; i++) {
                specificity += this._segments[i].specificity;
            }
        }
        return specificity;
    };
    ParamRoutePath.prototype._calculateHash = function () {
        // this function is used to determine whether a route config path like `/foo/:id` collides with
        // `/foo/:name`
        var i, length = this._segments.length;
        var hashParts = [];
        for (i = 0; i < length; i++) {
            hashParts.push(this._segments[i].hash);
        }
        return hashParts.join('/');
    };
    ParamRoutePath.prototype._assertValidPath = function (path) {
        if (StringWrapper.contains(path, '#')) {
            throw new BaseException("Path \"" + path + "\" should not include \"#\". Use \"HashLocationStrategy\" instead.");
        }
        var illegalCharacter = RegExpWrapper.firstMatch(ParamRoutePath.RESERVED_CHARS, path);
        if (isPresent(illegalCharacter)) {
            throw new BaseException("Path \"" + path + "\" contains \"" + illegalCharacter[0] + "\" which is not allowed in a route config.");
        }
    };
    ParamRoutePath.RESERVED_CHARS = RegExpWrapper.create('//|\\(|\\)|;|\\?|=');
    return ParamRoutePath;
})();
exports.ParamRoutePath = ParamRoutePath;
var REGEXP_PERCENT = /%/g;
var REGEXP_SLASH = /\//g;
var REGEXP_OPEN_PARENT = /\(/g;
var REGEXP_CLOSE_PARENT = /\)/g;
var REGEXP_SEMICOLON = /;/g;
function encodeDynamicSegment(value) {
    if (isBlank(value)) {
        return null;
    }
    value = StringWrapper.replaceAll(value, REGEXP_PERCENT, '%25');
    value = StringWrapper.replaceAll(value, REGEXP_SLASH, '%2F');
    value = StringWrapper.replaceAll(value, REGEXP_OPEN_PARENT, '%28');
    value = StringWrapper.replaceAll(value, REGEXP_CLOSE_PARENT, '%29');
    value = StringWrapper.replaceAll(value, REGEXP_SEMICOLON, '%3B');
    return value;
}
var REGEXP_ENC_SEMICOLON = /%3B/ig;
var REGEXP_ENC_CLOSE_PARENT = /%29/ig;
var REGEXP_ENC_OPEN_PARENT = /%28/ig;
var REGEXP_ENC_SLASH = /%2F/ig;
var REGEXP_ENC_PERCENT = /%25/ig;
function decodeDynamicSegment(value) {
    if (isBlank(value)) {
        return null;
    }
    value = StringWrapper.replaceAll(value, REGEXP_ENC_SEMICOLON, ';');
    value = StringWrapper.replaceAll(value, REGEXP_ENC_CLOSE_PARENT, ')');
    value = StringWrapper.replaceAll(value, REGEXP_ENC_OPEN_PARENT, '(');
    value = StringWrapper.replaceAll(value, REGEXP_ENC_SLASH, '/');
    value = StringWrapper.replaceAll(value, REGEXP_ENC_PERCENT, '%');
    return value;
}
var route_path_1 = routerRequire('./route_path');
var RegexRoutePath = (function () {
    function RegexRoutePath(_reString, _serializer) {
        this._reString = _reString;
        this._serializer = _serializer;
        this.terminal = true;
        this.specificity = '2';
        this.hash = this._reString;
        this._regex = RegExpWrapper.create(this._reString);
    }
    RegexRoutePath.prototype.matchUrl = function (url) {
        var urlPath = url.toString();
        var params = {};
        var matcher = RegExpWrapper.matcher(this._regex, urlPath);
        var match = RegExpMatcherWrapper.next(matcher);
        if (isBlank(match)) {
            return null;
        }
        for (var i = 0; i < match.length; i += 1) {
            params[i.toString()] = match[i];
        }
        return new route_path_1.MatchedUrl(urlPath, [], params, [], null);
    };
    RegexRoutePath.prototype.generateUrl = function (params) { return this._serializer(params); };
    RegexRoutePath.prototype.toString = function () { return this._reString; };
    return RegexRoutePath;
})();
exports.RegexRoutePath = RegexRoutePath;
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * `RouteParams` is an immutable map of parameters for the given route
 * based on the url matcher and optional parameters for that route.
 *
 * You can inject `RouteParams` into the constructor of a component to use it.
 *
 * ### Example
 *
 * ```
 * import {Component} from 'angular2/core';
 * import {bootstrap} from 'angular2/platform/browser';
 * import {Router, ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig, RouteParams} from
 * 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {path: '/user/:id', component: UserCmp, name: 'UserCmp'},
 * ])
 * class AppCmp {}
 *
 * @Component({ template: 'user: {{id}}' })
 * class UserCmp {
 *   id: string;
 *   constructor(params: RouteParams) {
 *     this.id = params.get('id');
 *   }
 * }
 *
 * bootstrap(AppCmp, ROUTER_PROVIDERS);
 * ```
 */
var RouteParams = (function () {
    function RouteParams(params) {
        this.params = params;
    }
    RouteParams.prototype.get = function (param) { return normalizeBlank(StringMapWrapper.get(this.params, param)); };
    return RouteParams;
})();
exports.RouteParams = RouteParams;
/**
 * `RouteData` is an immutable map of additional data you can configure in your {@link Route}.
 *
 * You can inject `RouteData` into the constructor of a component to use it.
 *
 * ### Example
 *
 * ```
 * import {Component} from 'angular2/core';
 * import {bootstrap} from 'angular2/platform/browser';
 * import {Router, ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig, RouteData} from
 * 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {path: '/user/:id', component: UserCmp, name: 'UserCmp', data: {isAdmin: true}},
 * ])
 * class AppCmp {}
 *
 * @Component({
 *   ...,
 *   template: 'user: {{isAdmin}}'
 * })
 * class UserCmp {
 *   string: isAdmin;
 *   constructor(data: RouteData) {
 *     this.isAdmin = data.get('isAdmin');
 *   }
 * }
 *
 * bootstrap(AppCmp, ROUTER_PROVIDERS);
 * ```
 */
var RouteData = (function () {
    function RouteData(data) {
        if (data === void 0) { data = CONST_EXPR({}); }
        this.data = data;
    }
    RouteData.prototype.get = function (key) { return normalizeBlank(StringMapWrapper.get(this.data, key)); };
    return RouteData;
})();
exports.RouteData = RouteData;
exports.BLANK_ROUTE_DATA = new RouteData();
/**
 * `Instruction` is a tree of {@link ComponentInstruction}s with all the information needed
 * to transition each component in the app to a given route, including all auxiliary routes.
 *
 * `Instruction`s can be created using {@link Router#generate}, and can be used to
 * perform route changes with {@link Router#navigateByInstruction}.
 *
 * ### Example
 *
 * ```
 * import {Component} from 'angular2/core';
 * import {bootstrap} from 'angular2/platform/browser';
 * import {Router, ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig} from 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *   constructor(router: Router) {
 *     var instruction = router.generate(['/MyRoute']);
 *     router.navigateByInstruction(instruction);
 *   }
 * }
 *
 * bootstrap(AppCmp, ROUTER_PROVIDERS);
 * ```
 */
var Instruction = (function () {
    function Instruction(component, child, auxInstruction) {
        this.component = component;
        this.child = child;
        this.auxInstruction = auxInstruction;
    }
    Object.defineProperty(Instruction.prototype, "urlPath", {
        get: function () { return isPresent(this.component) ? this.component.urlPath : ''; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Instruction.prototype, "urlParams", {
        get: function () { return isPresent(this.component) ? this.component.urlParams : []; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Instruction.prototype, "specificity", {
        get: function () {
            var total = '';
            if (isPresent(this.component)) {
                total += this.component.specificity;
            }
            if (isPresent(this.child)) {
                total += this.child.specificity;
            }
            return total;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * converts the instruction into a URL string
     */
    Instruction.prototype.toRootUrl = function () { return this.toUrlPath() + this.toUrlQuery(); };
    /** @internal */
    Instruction.prototype._toNonRootUrl = function () {
        return this._stringifyPathMatrixAuxPrefixed() +
            (isPresent(this.child) ? this.child._toNonRootUrl() : '');
    };
    Instruction.prototype.toUrlQuery = function () { return this.urlParams.length > 0 ? ('?' + this.urlParams.join('&')) : ''; };
    /**
     * Returns a new instruction that shares the state of the existing instruction, but with
     * the given child {@link Instruction} replacing the existing child.
     */
    Instruction.prototype.replaceChild = function (child) {
        return new ResolvedInstruction(this.component, child, this.auxInstruction);
    };
    /**
     * If the final URL for the instruction is ``
     */
    Instruction.prototype.toUrlPath = function () {
        return this.urlPath + this._stringifyAux() +
            (isPresent(this.child) ? this.child._toNonRootUrl() : '');
    };
    // default instructions override these
    Instruction.prototype.toLinkUrl = function () {
        return this.urlPath + this._stringifyAux() +
            (isPresent(this.child) ? this.child._toLinkUrl() : '') + this.toUrlQuery();
    };
    // this is the non-root version (called recursively)
    /** @internal */
    Instruction.prototype._toLinkUrl = function () {
        return this._stringifyPathMatrixAuxPrefixed() +
            (isPresent(this.child) ? this.child._toLinkUrl() : '');
    };
    /** @internal */
    Instruction.prototype._stringifyPathMatrixAuxPrefixed = function () {
        var primary = this._stringifyPathMatrixAux();
        if (primary.length > 0) {
            primary = '/' + primary;
        }
        return primary;
    };
    /** @internal */
    Instruction.prototype._stringifyMatrixParams = function () {
        return this.urlParams.length > 0 ? (';' + this.urlParams.join(';')) : '';
    };
    /** @internal */
    Instruction.prototype._stringifyPathMatrixAux = function () {
        if (isBlank(this.component)) {
            return '';
        }
        return this.urlPath + this._stringifyMatrixParams() + this._stringifyAux();
    };
    /** @internal */
    Instruction.prototype._stringifyAux = function () {
        var routes = [];
        StringMapWrapper.forEach(this.auxInstruction, function (auxInstruction, _) {
            routes.push(auxInstruction._stringifyPathMatrixAux());
        });
        if (routes.length > 0) {
            return '(' + routes.join('//') + ')';
        }
        return '';
    };
    return Instruction;
})();
exports.Instruction = Instruction;
/**
 * a resolved instruction has an outlet instruction for itself, but maybe not for...
 */
var ResolvedInstruction = (function (_super) {
    __extends(ResolvedInstruction, _super);
    function ResolvedInstruction(component, child, auxInstruction) {
        _super.call(this, component, child, auxInstruction);
    }
    ResolvedInstruction.prototype.resolveComponent = function () {
        return PromiseWrapper.resolve(this.component);
    };
    return ResolvedInstruction;
})(Instruction);
exports.ResolvedInstruction = ResolvedInstruction;
/**
 * Represents a resolved default route
 */
var DefaultInstruction = (function (_super) {
    __extends(DefaultInstruction, _super);
    function DefaultInstruction(component, child) {
        _super.call(this, component, child, {});
    }
    DefaultInstruction.prototype.toLinkUrl = function () { return ''; };
    /** @internal */
    DefaultInstruction.prototype._toLinkUrl = function () { return ''; };
    return DefaultInstruction;
})(ResolvedInstruction);
exports.DefaultInstruction = DefaultInstruction;
/**
 * Represents a component that may need to do some redirection or lazy loading at a later time.
 */
var UnresolvedInstruction = (function (_super) {
    __extends(UnresolvedInstruction, _super);
    function UnresolvedInstruction(_resolver, _urlPath, _urlParams) {
        if (_urlPath === void 0) { _urlPath = ''; }
        if (_urlParams === void 0) { _urlParams = CONST_EXPR([]); }
        _super.call(this, null, null, {});
        this._resolver = _resolver;
        this._urlPath = _urlPath;
        this._urlParams = _urlParams;
    }
    Object.defineProperty(UnresolvedInstruction.prototype, "urlPath", {
        get: function () {
            if (isPresent(this.component)) {
                return this.component.urlPath;
            }
            if (isPresent(this._urlPath)) {
                return this._urlPath;
            }
            return '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UnresolvedInstruction.prototype, "urlParams", {
        get: function () {
            if (isPresent(this.component)) {
                return this.component.urlParams;
            }
            if (isPresent(this._urlParams)) {
                return this._urlParams;
            }
            return [];
        },
        enumerable: true,
        configurable: true
    });
    UnresolvedInstruction.prototype.resolveComponent = function () {
        var _this = this;
        if (isPresent(this.component)) {
            return PromiseWrapper.resolve(this.component);
        }
        return this._resolver().then(function (instruction) {
            _this.child = isPresent(instruction) ? instruction.child : null;
            return _this.component = isPresent(instruction) ? instruction.component : null;
        });
    };
    return UnresolvedInstruction;
})(Instruction);
exports.UnresolvedInstruction = UnresolvedInstruction;
var RedirectInstruction = (function (_super) {
    __extends(RedirectInstruction, _super);
    function RedirectInstruction(component, child, auxInstruction, _specificity) {
        _super.call(this, component, child, auxInstruction);
        this._specificity = _specificity;
    }
    Object.defineProperty(RedirectInstruction.prototype, "specificity", {
        get: function () { return this._specificity; },
        enumerable: true,
        configurable: true
    });
    return RedirectInstruction;
})(ResolvedInstruction);
exports.RedirectInstruction = RedirectInstruction;
/**
 * A `ComponentInstruction` represents the route state for a single component.
 *
 * `ComponentInstructions` is a public API. Instances of `ComponentInstruction` are passed
 * to route lifecycle hooks, like {@link CanActivate}.
 *
 * `ComponentInstruction`s are [hash consed](https://en.wikipedia.org/wiki/Hash_consing). You should
 * never construct one yourself with "new." Instead, rely on {@link Router/RouteRecognizer} to
 * construct `ComponentInstruction`s.
 *
 * You should not modify this object. It should be treated as immutable.
 */
var ComponentInstruction = (function () {
    /**
     * @internal
     */
    function ComponentInstruction(urlPath, urlParams, data, componentType, terminal, specificity, params, routeName) {
        if (params === void 0) { params = null; }
        this.urlPath = urlPath;
        this.urlParams = urlParams;
        this.componentType = componentType;
        this.terminal = terminal;
        this.specificity = specificity;
        this.params = params;
        this.routeName = routeName;
        this.reuse = false;
        this.routeData = isPresent(data) ? data : exports.BLANK_ROUTE_DATA;
    }
    return ComponentInstruction;
})();
exports.ComponentInstruction = ComponentInstruction;
var core_1 = routerRequire('angular2/core');
var route_config_impl_1 = routerRequire('./route_config/route_config_impl');
var rules_1 = routerRequire('./rules/rules');
var rule_set_1 = routerRequire('./rules/rule_set');
var instruction_1 = routerRequire('./instruction');
var route_config_normalizer_1 = routerRequire('./route_config/route_config_normalizer');
var url_parser_1 = routerRequire('./url_parser');
var _resolveToNull = PromiseWrapper.resolve(null);
// A LinkItemArray is an array, which describes a set of routes
// The items in the array are found in groups:
// - the first item is the name of the route
// - the next items are:
//   - an object containing parameters
//   - or an array describing an aux route
// export type LinkRouteItem = string | Object;
// export type LinkItem = LinkRouteItem | Array<LinkRouteItem>;
// export type LinkItemArray = Array<LinkItem>;
/**
 * Token used to bind the component with the top-level {@link RouteConfig}s for the
 * application.
 *
 * ### Example ([live demo](http://plnkr.co/edit/iRUP8B5OUbxCWQ3AcIDm))
 *
 * ```
 * import {Component} from 'angular2/core';
 * import {
 *   ROUTER_DIRECTIVES,
 *   ROUTER_PROVIDERS,
 *   RouteConfig
 * } from 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *   // ...
 * }
 *
 * bootstrap(AppCmp, [ROUTER_PROVIDERS]);
 * ```
 */
exports.ROUTER_PRIMARY_COMPONENT = CONST_EXPR(new core_1.OpaqueToken('RouterPrimaryComponent'));
/**
 * The RouteRegistry holds route configurations for each component in an Angular app.
 * It is responsible for creating Instructions from URLs, and generating URLs based on route and
 * parameters.
 */
var RouteRegistry = (function () {
    function RouteRegistry(_rootComponent) {
        this._rootComponent = _rootComponent;
        this._rules = new Map();
    }
    /**
     * Given a component and a configuration object, add the route to this registry
     */
    RouteRegistry.prototype.config = function (parentComponent, config) {
        config = route_config_normalizer_1.normalizeRouteConfig(config, this);
        // this is here because Dart type guard reasons
        if (config instanceof route_config_impl_1.Route) {
            route_config_normalizer_1.assertComponentExists(config.component, config.path);
        }
        else if (config instanceof route_config_impl_1.AuxRoute) {
            route_config_normalizer_1.assertComponentExists(config.component, config.path);
        }
        var rules = this._rules.get(parentComponent);
        if (isBlank(rules)) {
            rules = new rule_set_1.RuleSet();
            this._rules.set(parentComponent, rules);
        }
        var terminal = rules.config(config);
        if (config instanceof route_config_impl_1.Route) {
            if (terminal) {
                assertTerminalComponent(config.component, config.path);
            }
            else {
                this.configFromComponent(config.component);
            }
        }
    };
    /**
     * Reads the annotations of a component and configures the registry based on them
     */
    RouteRegistry.prototype.configFromComponent = function (component) {
        var _this = this;
        if (!isType(component)) {
            return;
        }
        // Don't read the annotations from a type more than once –
        // this prevents an infinite loop if a component routes recursively.
        if (this._rules.has(component)) {
            return;
        }
        var annotations = reflector.annotations(component);
        if (isPresent(annotations)) {
            for (var i = 0; i < annotations.length; i++) {
                var annotation = annotations[i];
                if (annotation instanceof route_config_impl_1.RouteConfig) {
                    var routeCfgs = annotation.configs;
                    routeCfgs.forEach(function (config) { return _this.config(component, config); });
                }
            }
        }
    };
    /**
     * Given a URL and a parent component, return the most specific instruction for navigating
     * the application into the state specified by the url
     */
    RouteRegistry.prototype.recognize = function (url, ancestorInstructions) {
        var parsedUrl = url_parser_1.parser.parse(url);
        return this._recognize(parsedUrl, []);
    };
    /**
     * Recognizes all parent-child routes, but creates unresolved auxiliary routes
     */
    RouteRegistry.prototype._recognize = function (parsedUrl, ancestorInstructions, _aux) {
        var _this = this;
        if (_aux === void 0) { _aux = false; }
        var parentInstruction = ListWrapper.last(ancestorInstructions);
        var parentComponent = isPresent(parentInstruction) ? parentInstruction.component.componentType :
            this._rootComponent;
        var rules = this._rules.get(parentComponent);
        if (isBlank(rules)) {
            return _resolveToNull;
        }
        // Matches some beginning part of the given URL
        var possibleMatches = _aux ? rules.recognizeAuxiliary(parsedUrl) : rules.recognize(parsedUrl);
        var matchPromises = possibleMatches.map(function (candidate) { return candidate.then(function (candidate) {
            if (candidate instanceof rules_1.PathMatch) {
                var auxParentInstructions = ancestorInstructions.length > 0 ? [ListWrapper.last(ancestorInstructions)] : [];
                var auxInstructions = _this._auxRoutesToUnresolved(candidate.remainingAux, auxParentInstructions);
                var instruction = new instruction_1.ResolvedInstruction(candidate.instruction, null, auxInstructions);
                if (isBlank(candidate.instruction) || candidate.instruction.terminal) {
                    return instruction;
                }
                var newAncestorInstructions = ancestorInstructions.concat([instruction]);
                return _this._recognize(candidate.remaining, newAncestorInstructions)
                    .then(function (childInstruction) {
                    if (isBlank(childInstruction)) {
                        return null;
                    }
                    // redirect instructions are already absolute
                    if (childInstruction instanceof instruction_1.RedirectInstruction) {
                        return childInstruction;
                    }
                    instruction.child = childInstruction;
                    return instruction;
                });
            }
            if (candidate instanceof rules_1.RedirectMatch) {
                var instruction = _this.generate(candidate.redirectTo, ancestorInstructions.concat([null]));
                return new instruction_1.RedirectInstruction(instruction.component, instruction.child, instruction.auxInstruction, candidate.specificity);
            }
        }); });
        if ((isBlank(parsedUrl) || parsedUrl.path == '') && possibleMatches.length == 0) {
            return PromiseWrapper.resolve(this.generateDefault(parentComponent));
        }
        return PromiseWrapper.all(matchPromises).then(mostSpecific);
    };
    RouteRegistry.prototype._auxRoutesToUnresolved = function (auxRoutes, parentInstructions) {
        var _this = this;
        var unresolvedAuxInstructions = {};
        auxRoutes.forEach(function (auxUrl) {
            unresolvedAuxInstructions[auxUrl.path] = new instruction_1.UnresolvedInstruction(function () { return _this._recognize(auxUrl, parentInstructions, true); });
        });
        return unresolvedAuxInstructions;
    };
    /**
     * Given a normalized list with component names and params like: `['user', {id: 3 }]`
     * generates a url with a leading slash relative to the provided `parentComponent`.
     *
     * If the optional param `_aux` is `true`, then we generate starting at an auxiliary
     * route boundary.
     */
    RouteRegistry.prototype.generate = function (linkParams, ancestorInstructions, _aux) {
        if (_aux === void 0) { _aux = false; }
        var params = splitAndFlattenLinkParams(linkParams);
        var prevInstruction;
        // The first segment should be either '.' (generate from parent) or '' (generate from root).
        // When we normalize above, we strip all the slashes, './' becomes '.' and '/' becomes ''.
        if (ListWrapper.first(params) == '') {
            params.shift();
            prevInstruction = ListWrapper.first(ancestorInstructions);
            ancestorInstructions = [];
        }
        else {
            prevInstruction = ancestorInstructions.length > 0 ? ancestorInstructions.pop() : null;
            if (ListWrapper.first(params) == '.') {
                params.shift();
            }
            else if (ListWrapper.first(params) == '..') {
                while (ListWrapper.first(params) == '..') {
                    if (ancestorInstructions.length <= 0) {
                        throw new BaseException("Link \"" + ListWrapper.toJSON(linkParams) + "\" has too many \"../\" segments.");
                    }
                    prevInstruction = ancestorInstructions.pop();
                    params = ListWrapper.slice(params, 1);
                }
            }
            else {
                // we must only peak at the link param, and not consume it
                var routeName = ListWrapper.first(params);
                var parentComponentType = this._rootComponent;
                var grandparentComponentType = null;
                if (ancestorInstructions.length > 1) {
                    var parentComponentInstruction = ancestorInstructions[ancestorInstructions.length - 1];
                    var grandComponentInstruction = ancestorInstructions[ancestorInstructions.length - 2];
                    parentComponentType = parentComponentInstruction.component.componentType;
                    grandparentComponentType = grandComponentInstruction.component.componentType;
                }
                else if (ancestorInstructions.length == 1) {
                    parentComponentType = ancestorInstructions[0].component.componentType;
                    grandparentComponentType = this._rootComponent;
                }
                // For a link with no leading `./`, `/`, or `../`, we look for a sibling and child.
                // If both exist, we throw. Otherwise, we prefer whichever exists.
                var childRouteExists = this.hasRoute(routeName, parentComponentType);
                var parentRouteExists = isPresent(grandparentComponentType) &&
                    this.hasRoute(routeName, grandparentComponentType);
                if (parentRouteExists && childRouteExists) {
                    var msg = "Link \"" + ListWrapper.toJSON(linkParams) + "\" is ambiguous, use \"./\" or \"../\" to disambiguate.";
                    throw new BaseException(msg);
                }
                if (parentRouteExists) {
                    prevInstruction = ancestorInstructions.pop();
                }
            }
        }
        if (params[params.length - 1] == '') {
            params.pop();
        }
        if (params.length > 0 && params[0] == '') {
            params.shift();
        }
        if (params.length < 1) {
            var msg = "Link \"" + ListWrapper.toJSON(linkParams) + "\" must include a route name.";
            throw new BaseException(msg);
        }
        var generatedInstruction = this._generate(params, ancestorInstructions, prevInstruction, _aux, linkParams);
        // we don't clone the first (root) element
        for (var i = ancestorInstructions.length - 1; i >= 0; i--) {
            var ancestorInstruction = ancestorInstructions[i];
            if (isBlank(ancestorInstruction)) {
                break;
            }
            generatedInstruction = ancestorInstruction.replaceChild(generatedInstruction);
        }
        return generatedInstruction;
    };
    /*
     * Internal helper that does not make any assertions about the beginning of the link DSL.
     * `ancestorInstructions` are parents that will be cloned.
     * `prevInstruction` is the existing instruction that would be replaced, but which might have
     * aux routes that need to be cloned.
     */
    RouteRegistry.prototype._generate = function (linkParams, ancestorInstructions, prevInstruction, _aux, _originalLink) {
        var _this = this;
        if (_aux === void 0) { _aux = false; }
        var parentComponentType = this._rootComponent;
        var componentInstruction = null;
        var auxInstructions = {};
        var parentInstruction = ListWrapper.last(ancestorInstructions);
        if (isPresent(parentInstruction) && isPresent(parentInstruction.component)) {
            parentComponentType = parentInstruction.component.componentType;
        }
        if (linkParams.length == 0) {
            var defaultInstruction = this.generateDefault(parentComponentType);
            if (isBlank(defaultInstruction)) {
                throw new BaseException("Link \"" + ListWrapper.toJSON(_originalLink) + "\" does not resolve to a terminal instruction.");
            }
            return defaultInstruction;
        }
        // for non-aux routes, we want to reuse the predecessor's existing primary and aux routes
        // and only override routes for which the given link DSL provides
        if (isPresent(prevInstruction) && !_aux) {
            auxInstructions = StringMapWrapper.merge(prevInstruction.auxInstruction, auxInstructions);
            componentInstruction = prevInstruction.component;
        }
        var rules = this._rules.get(parentComponentType);
        if (isBlank(rules)) {
            throw new BaseException("Component \"" + getTypeNameForDebugging(parentComponentType) + "\" has no route config.");
        }
        var linkParamIndex = 0;
        var routeParams = {};
        // first, recognize the primary route if one is provided
        if (linkParamIndex < linkParams.length && isString(linkParams[linkParamIndex])) {
            var routeName = linkParams[linkParamIndex];
            if (routeName == '' || routeName == '.' || routeName == '..') {
                throw new BaseException("\"" + routeName + "/\" is only allowed at the beginning of a link DSL.");
            }
            linkParamIndex += 1;
            if (linkParamIndex < linkParams.length) {
                var linkParam = linkParams[linkParamIndex];
                if (isStringMap(linkParam) && !isArray(linkParam)) {
                    routeParams = linkParam;
                    linkParamIndex += 1;
                }
            }
            var routeRecognizer = (_aux ? rules.auxRulesByName : rules.rulesByName).get(routeName);
            if (isBlank(routeRecognizer)) {
                throw new BaseException("Component \"" + getTypeNameForDebugging(parentComponentType) + "\" has no route named \"" + routeName + "\".");
            }
            // Create an "unresolved instruction" for async routes
            // we'll figure out the rest of the route when we resolve the instruction and
            // perform a navigation
            if (isBlank(routeRecognizer.handler.componentType)) {
                var generatedUrl = routeRecognizer.generateComponentPathValues(routeParams);
                return new instruction_1.UnresolvedInstruction(function () {
                    return routeRecognizer.handler.resolveComponentType().then(function (_) {
                        return _this._generate(linkParams, ancestorInstructions, prevInstruction, _aux, _originalLink);
                    });
                }, generatedUrl.urlPath, url_parser_1.convertUrlParamsToArray(generatedUrl.urlParams));
            }
            componentInstruction = _aux ? rules.generateAuxiliary(routeName, routeParams) :
                rules.generate(routeName, routeParams);
        }
        // Next, recognize auxiliary instructions.
        // If we have an ancestor instruction, we preserve whatever aux routes are active from it.
        while (linkParamIndex < linkParams.length && isArray(linkParams[linkParamIndex])) {
            var auxParentInstruction = [parentInstruction];
            var auxInstruction = this._generate(linkParams[linkParamIndex], auxParentInstruction, null, true, _originalLink);
            // TODO: this will not work for aux routes with parameters or multiple segments
            auxInstructions[auxInstruction.component.urlPath] = auxInstruction;
            linkParamIndex += 1;
        }
        var instruction = new instruction_1.ResolvedInstruction(componentInstruction, null, auxInstructions);
        // If the component is sync, we can generate resolved child route instructions
        // If not, we'll resolve the instructions at navigation time
        if (isPresent(componentInstruction) && isPresent(componentInstruction.componentType)) {
            var childInstruction = null;
            if (componentInstruction.terminal) {
                if (linkParamIndex >= linkParams.length) {
                }
            }
            else {
                var childAncestorComponents = ancestorInstructions.concat([instruction]);
                var remainingLinkParams = linkParams.slice(linkParamIndex);
                childInstruction = this._generate(remainingLinkParams, childAncestorComponents, null, false, _originalLink);
            }
            instruction.child = childInstruction;
        }
        return instruction;
    };
    RouteRegistry.prototype.hasRoute = function (name, parentComponent) {
        var rules = this._rules.get(parentComponent);
        if (isBlank(rules)) {
            return false;
        }
        return rules.hasRoute(name);
    };
    RouteRegistry.prototype.generateDefault = function (componentCursor) {
        var _this = this;
        if (isBlank(componentCursor)) {
            return null;
        }
        var rules = this._rules.get(componentCursor);
        if (isBlank(rules) || isBlank(rules.defaultRule)) {
            return null;
        }
        var defaultChild = null;
        if (isPresent(rules.defaultRule.handler.componentType)) {
            var componentInstruction = rules.defaultRule.generate({});
            if (!rules.defaultRule.terminal) {
                defaultChild = this.generateDefault(rules.defaultRule.handler.componentType);
            }
            return new instruction_1.DefaultInstruction(componentInstruction, defaultChild);
        }
        return new instruction_1.UnresolvedInstruction(function () {
            return rules.defaultRule.handler.resolveComponentType().then(function (_) { return _this.generateDefault(componentCursor); });
        });
    };
    return RouteRegistry;
})();
exports.RouteRegistry = RouteRegistry;
/*
 * Given: ['/a/b', {c: 2}]
 * Returns: ['', 'a', 'b', {c: 2}]
 */
function splitAndFlattenLinkParams(linkParams) {
    var accumulation = [];
    linkParams.forEach(function (item) {
        if (isString(item)) {
            var strItem = item;
            accumulation = accumulation.concat(strItem.split('/'));
        }
        else {
            accumulation.push(item);
        }
    });
    return accumulation;
}
/*
 * Given a list of instructions, returns the most specific instruction
 */
function mostSpecific(instructions) {
    instructions = instructions.filter(function (instruction) { return isPresent(instruction); });
    if (instructions.length == 0) {
        return null;
    }
    if (instructions.length == 1) {
        return instructions[0];
    }
    var first = instructions[0];
    var rest = instructions.slice(1);
    return rest.reduce(function (instruction, contender) {
        if (compareSpecificityStrings(contender.specificity, instruction.specificity) == -1) {
            return contender;
        }
        return instruction;
    }, first);
}
/*
 * Expects strings to be in the form of "[0-2]+"
 * Returns -1 if string A should be sorted above string B, 1 if it should be sorted after,
 * or 0 if they are the same.
 */
function compareSpecificityStrings(a, b) {
    var l = Math.min(a.length, b.length);
    for (var i = 0; i < l; i += 1) {
        var ai = StringWrapper.charCodeAt(a, i);
        var bi = StringWrapper.charCodeAt(b, i);
        var difference = bi - ai;
        if (difference != 0) {
            return difference;
        }
    }
    return a.length - b.length;
}
function assertTerminalComponent(component, path) {
    if (!isType(component)) {
        return;
    }
    var annotations = reflector.annotations(component);
    if (isPresent(annotations)) {
        for (var i = 0; i < annotations.length; i++) {
            var annotation = annotations[i];
            if (annotation instanceof route_config_impl_1.RouteConfig) {
                throw new BaseException("Child routes are not allowed for \"" + path + "\". Use \"...\" on the parent's route path.");
            }
        }
    }
}
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var route_lifecycle_reflector_1 = routerRequire('./lifecycle/route_lifecycle_reflector');
var _resolveToTrue = PromiseWrapper.resolve(true);
var _resolveToFalse = PromiseWrapper.resolve(false);
/**
 * The `Router` is responsible for mapping URLs to components.
 *
 * You can see the state of the router by inspecting the read-only field `router.navigating`.
 * This may be useful for showing a spinner, for instance.
 *
 * ## Concepts
 *
 * Routers and component instances have a 1:1 correspondence.
 *
 * The router holds reference to a number of {@link RouterOutlet}.
 * An outlet is a placeholder that the router dynamically fills in depending on the current URL.
 *
 * When the router navigates from a URL, it must first recognize it and serialize it into an
 * `Instruction`.
 * The router uses the `RouteRegistry` to get an `Instruction`.
 */
var Router = (function () {
    function Router(registry, parent, hostComponent, root) {
        this.registry = registry;
        this.parent = parent;
        this.hostComponent = hostComponent;
        this.root = root;
        this.navigating = false;
        /**
         * The current `Instruction` for the router
         */
        this.currentInstruction = null;
        this._currentNavigation = _resolveToTrue;
        this._outlet = null;
        this._auxRouters = new Map();
        this._subject = new EventEmitter();
    }
    /**
     * Constructs a child router. You probably don't need to use this unless you're writing a reusable
     * component.
     */
    Router.prototype.childRouter = function (hostComponent) {
        return this._childRouter = new ChildRouter(this, hostComponent);
    };
    /**
     * Constructs a child router. You probably don't need to use this unless you're writing a reusable
     * component.
     */
    Router.prototype.auxRouter = function (hostComponent) { return new ChildRouter(this, hostComponent); };
    /**
     * Register an outlet to be notified of primary route changes.
     *
     * You probably don't need to use this unless you're writing a reusable component.
     */
    Router.prototype.registerPrimaryOutlet = function (outlet) {
        if (isPresent(outlet.name)) {
            throw new BaseException("registerPrimaryOutlet expects to be called with an unnamed outlet.");
        }
        if (isPresent(this._outlet)) {
            throw new BaseException("Primary outlet is already registered.");
        }
        this._outlet = outlet;
        if (isPresent(this.currentInstruction)) {
            return this.commit(this.currentInstruction, false);
        }
        return _resolveToTrue;
    };
    /**
     * Unregister an outlet (because it was destroyed, etc).
     *
     * You probably don't need to use this unless you're writing a custom outlet implementation.
     */
    Router.prototype.unregisterPrimaryOutlet = function (outlet) {
        if (isPresent(outlet.name)) {
            throw new BaseException("registerPrimaryOutlet expects to be called with an unnamed outlet.");
        }
        this._outlet = null;
    };
    /**
     * Register an outlet to notified of auxiliary route changes.
     *
     * You probably don't need to use this unless you're writing a reusable component.
     */
    Router.prototype.registerAuxOutlet = function (outlet) {
        var outletName = outlet.name;
        if (isBlank(outletName)) {
            throw new BaseException("registerAuxOutlet expects to be called with an outlet with a name.");
        }
        var router = this.auxRouter(this.hostComponent);
        this._auxRouters.set(outletName, router);
        router._outlet = outlet;
        var auxInstruction;
        if (isPresent(this.currentInstruction) &&
            isPresent(auxInstruction = this.currentInstruction.auxInstruction[outletName])) {
            return router.commit(auxInstruction);
        }
        return _resolveToTrue;
    };
    /**
     * Given an instruction, returns `true` if the instruction is currently active,
     * otherwise `false`.
     */
    Router.prototype.isRouteActive = function (instruction) {
        var _this = this;
        var router = this;
        if (isBlank(this.currentInstruction)) {
            return false;
        }
        // `instruction` corresponds to the root router
        while (isPresent(router.parent) && isPresent(instruction.child)) {
            router = router.parent;
            instruction = instruction.child;
        }
        if (isBlank(instruction.component) || isBlank(this.currentInstruction.component) ||
            this.currentInstruction.component.routeName != instruction.component.routeName) {
            return false;
        }
        var paramEquals = true;
        if (isPresent(this.currentInstruction.component.params)) {
            StringMapWrapper.forEach(instruction.component.params, function (value, key) {
                if (_this.currentInstruction.component.params[key] !== value) {
                    paramEquals = false;
                }
            });
        }
        return paramEquals;
    };
    /**
     * Dynamically update the routing configuration and trigger a navigation.
     *
     * ### Usage
     *
     * ```
     * router.config([
     *   { 'path': '/', 'component': IndexComp },
     *   { 'path': '/user/:id', 'component': UserComp },
     * ]);
     * ```
     */
    Router.prototype.config = function (definitions) {
        var _this = this;
        definitions.forEach(function (routeDefinition) { _this.registry.config(_this.hostComponent, routeDefinition); });
        return this.renavigate();
    };
    /**
     * Navigate based on the provided Route Link DSL. It's preferred to navigate with this method
     * over `navigateByUrl`.
     *
     * ### Usage
     *
     * This method takes an array representing the Route Link DSL:
     * ```
     * ['./MyCmp', {param: 3}]
     * ```
     * See the {@link RouterLink} directive for more.
     */
    Router.prototype.navigate = function (linkParams) {
        var instruction = this.generate(linkParams);
        return this.navigateByInstruction(instruction, false);
    };
    /**
     * Navigate to a URL. Returns a promise that resolves when navigation is complete.
     * It's preferred to navigate with `navigate` instead of this method, since URLs are more brittle.
     *
     * If the given URL begins with a `/`, router will navigate absolutely.
     * If the given URL does not begin with `/`, the router will navigate relative to this component.
     */
    Router.prototype.navigateByUrl = function (url, _skipLocationChange) {
        var _this = this;
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        return this._currentNavigation = this._currentNavigation.then(function (_) {
            _this.lastNavigationAttempt = url;
            _this._startNavigating();
            return _this._afterPromiseFinishNavigating(_this.recognize(url).then(function (instruction) {
                if (isBlank(instruction)) {
                    return false;
                }
                return _this._navigate(instruction, _skipLocationChange);
            }));
        });
    };
    /**
     * Navigate via the provided instruction. Returns a promise that resolves when navigation is
     * complete.
     */
    Router.prototype.navigateByInstruction = function (instruction, _skipLocationChange) {
        var _this = this;
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        if (isBlank(instruction)) {
            return _resolveToFalse;
        }
        return this._currentNavigation = this._currentNavigation.then(function (_) {
            _this._startNavigating();
            return _this._afterPromiseFinishNavigating(_this._navigate(instruction, _skipLocationChange));
        });
    };
    /** @internal */
    Router.prototype._settleInstruction = function (instruction) {
        var _this = this;
        return instruction.resolveComponent().then(function (_) {
            var unsettledInstructions = [];
            if (isPresent(instruction.component)) {
                instruction.component.reuse = false;
            }
            if (isPresent(instruction.child)) {
                unsettledInstructions.push(_this._settleInstruction(instruction.child));
            }
            StringMapWrapper.forEach(instruction.auxInstruction, function (instruction, _) {
                unsettledInstructions.push(_this._settleInstruction(instruction));
            });
            return PromiseWrapper.all(unsettledInstructions);
        });
    };
    /** @internal */
    Router.prototype._navigate = function (instruction, _skipLocationChange) {
        var _this = this;
        return this._settleInstruction(instruction)
            .then(function (_) { return _this._routerCanReuse(instruction); })
            .then(function (_) { return _this._canActivate(instruction); })
            .then(function (result) {
            if (!result) {
                return false;
            }
            return _this._routerCanDeactivate(instruction)
                .then(function (result) {
                if (result) {
                    return _this.commit(instruction, _skipLocationChange)
                        .then(function (_) {
                        _this._emitNavigationFinish(instruction.toRootUrl());
                        return true;
                    });
                }
            });
        });
    };
    Router.prototype._emitNavigationFinish = function (url) { ObservableWrapper.callEmit(this._subject, url); };
    /** @internal */
    Router.prototype._emitNavigationFail = function (url) { ObservableWrapper.callError(this._subject, url); };
    Router.prototype._afterPromiseFinishNavigating = function (promise) {
        var _this = this;
        return PromiseWrapper.catchError(promise.then(function (_) { return _this._finishNavigating(); }), function (err) {
            _this._finishNavigating();
            throw err;
        });
    };
    /*
     * Recursively set reuse flags
     */
    /** @internal */
    Router.prototype._routerCanReuse = function (instruction) {
        var _this = this;
        if (isBlank(this._outlet)) {
            return _resolveToFalse;
        }
        if (isBlank(instruction.component)) {
            return _resolveToTrue;
        }
        return this._outlet.routerCanReuse(instruction.component)
            .then(function (result) {
            instruction.component.reuse = result;
            if (result && isPresent(_this._childRouter) && isPresent(instruction.child)) {
                return _this._childRouter._routerCanReuse(instruction.child);
            }
        });
    };
    Router.prototype._canActivate = function (nextInstruction) {
        return canActivateOne(nextInstruction, this.currentInstruction);
    };
    Router.prototype._routerCanDeactivate = function (instruction) {
        var _this = this;
        if (isBlank(this._outlet)) {
            return _resolveToTrue;
        }
        var next;
        var childInstruction = null;
        var reuse = false;
        var componentInstruction = null;
        if (isPresent(instruction)) {
            childInstruction = instruction.child;
            componentInstruction = instruction.component;
            reuse = isBlank(instruction.component) || instruction.component.reuse;
        }
        if (reuse) {
            next = _resolveToTrue;
        }
        else {
            next = this._outlet.routerCanDeactivate(componentInstruction);
        }
        // TODO: aux route lifecycle hooks
        return next.then(function (result) {
            if (result == false) {
                return false;
            }
            if (isPresent(_this._childRouter)) {
                // TODO: ideally, this closure would map to async-await in Dart.
                // For now, casting to any to suppress an error.
                return _this._childRouter._routerCanDeactivate(childInstruction);
            }
            return true;
        });
    };
    /**
     * Updates this router and all descendant routers according to the given instruction
     */
    Router.prototype.commit = function (instruction, _skipLocationChange) {
        var _this = this;
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        this.currentInstruction = instruction;
        var next = _resolveToTrue;
        if (isPresent(this._outlet) && isPresent(instruction.component)) {
            var componentInstruction = instruction.component;
            if (componentInstruction.reuse) {
                next = this._outlet.reuse(componentInstruction);
            }
            else {
                next =
                    this.deactivate(instruction).then(function (_) { return _this._outlet.activate(componentInstruction); });
            }
            if (isPresent(instruction.child)) {
                next = next.then(function (_) {
                    if (isPresent(_this._childRouter)) {
                        return _this._childRouter.commit(instruction.child);
                    }
                });
            }
        }
        var promises = [];
        this._auxRouters.forEach(function (router, name) {
            if (isPresent(instruction.auxInstruction[name])) {
                promises.push(router.commit(instruction.auxInstruction[name]));
            }
        });
        return next.then(function (_) { return PromiseWrapper.all(promises); });
    };
    /** @internal */
    Router.prototype._startNavigating = function () { this.navigating = true; };
    /** @internal */
    Router.prototype._finishNavigating = function () { this.navigating = false; };
    /**
     * Subscribe to URL updates from the router
     */
    Router.prototype.subscribe = function (onNext, onError) {
        return ObservableWrapper.subscribe(this._subject, onNext, onError);
    };
    /**
     * Removes the contents of this router's outlet and all descendant outlets
     */
    Router.prototype.deactivate = function (instruction) {
        var _this = this;
        var childInstruction = null;
        var componentInstruction = null;
        if (isPresent(instruction)) {
            childInstruction = instruction.child;
            componentInstruction = instruction.component;
        }
        var next = _resolveToTrue;
        if (isPresent(this._childRouter)) {
            next = this._childRouter.deactivate(childInstruction);
        }
        if (isPresent(this._outlet)) {
            next = next.then(function (_) { return _this._outlet.deactivate(componentInstruction); });
        }
        // TODO: handle aux routes
        return next;
    };
    /**
     * Given a URL, returns an instruction representing the component graph
     */
    Router.prototype.recognize = function (url) {
        var ancestorComponents = this._getAncestorInstructions();
        return this.registry.recognize(url, ancestorComponents);
    };
    Router.prototype._getAncestorInstructions = function () {
        var ancestorInstructions = [this.currentInstruction];
        var ancestorRouter = this;
        while (isPresent(ancestorRouter = ancestorRouter.parent)) {
            ancestorInstructions.unshift(ancestorRouter.currentInstruction);
        }
        return ancestorInstructions;
    };
    /**
     * Navigates to either the last URL successfully navigated to, or the last URL requested if the
     * router has yet to successfully navigate.
     */
    Router.prototype.renavigate = function () {
        if (isBlank(this.lastNavigationAttempt)) {
            return this._currentNavigation;
        }
        return this.navigateByUrl(this.lastNavigationAttempt);
    };
    /**
     * Generate an `Instruction` based on the provided Route Link DSL.
     */
    Router.prototype.generate = function (linkParams) {
        var ancestorInstructions = this._getAncestorInstructions();
        return this.registry.generate(linkParams, ancestorInstructions);
    };
    return Router;
})();
exports.Router = Router;
var RootRouter = (function (_super) {
    __extends(RootRouter, _super);
    function RootRouter(registry, location, primaryComponent) {
        var _this = this;
        _super.call(this, registry, null, primaryComponent);
        this.root = this;
        this._location = location;
        this._locationSub = this._location.subscribe(function (change) {
            // we call recognize ourselves
            _this.recognize(change['url'])
                .then(function (instruction) {
                if (isPresent(instruction)) {
                    _this.navigateByInstruction(instruction, isPresent(change['pop']))
                        .then(function (_) {
                        // this is a popstate event; no need to change the URL
                        if (isPresent(change['pop']) && change['type'] != 'hashchange') {
                            return;
                        }
                        var emitPath = instruction.toUrlPath();
                        var emitQuery = instruction.toUrlQuery();
                        if (emitPath.length > 0 && emitPath[0] != '/') {
                            emitPath = '/' + emitPath;
                        }
                        // Because we've opted to use All hashchange events occur outside Angular.
                        // However, apps that are migrating might have hash links that operate outside
                        // angular to which routing must respond.
                        // To support these cases where we respond to hashchanges and redirect as a
                        // result, we need to replace the top item on the stack.
                        if (change['type'] == 'hashchange') {
                            if (instruction.toRootUrl() != _this._location.path()) {
                                _this._location.replaceState(emitPath, emitQuery);
                            }
                        }
                        else {
                            _this._location.go(emitPath, emitQuery);
                        }
                    });
                }
                else {
                    _this._emitNavigationFail(change['url']);
                }
            });
        });
        this.registry.configFromComponent(primaryComponent);
        this.navigateByUrl(location.path());
    }
    RootRouter.prototype.commit = function (instruction, _skipLocationChange) {
        var _this = this;
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        var emitPath = instruction.toUrlPath();
        var emitQuery = instruction.toUrlQuery();
        if (emitPath.length > 0 && emitPath[0] != '/') {
            emitPath = '/' + emitPath;
        }
        var promise = _super.prototype.commit.call(this, instruction);
        if (!_skipLocationChange) {
            promise = promise.then(function (_) { _this._location.go(emitPath, emitQuery); });
        }
        return promise;
    };
    RootRouter.prototype.dispose = function () {
        if (isPresent(this._locationSub)) {
            ObservableWrapper.dispose(this._locationSub);
            this._locationSub = null;
        }
    };
    return RootRouter;
})(Router);
exports.RootRouter = RootRouter;
var ChildRouter = (function (_super) {
    __extends(ChildRouter, _super);
    function ChildRouter(parent, hostComponent) {
        _super.call(this, parent.registry, parent, hostComponent, parent.root);
        this.parent = parent;
    }
    ChildRouter.prototype.navigateByUrl = function (url, _skipLocationChange) {
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        // Delegate navigation to the root router
        return this.parent.navigateByUrl(url, _skipLocationChange);
    };
    ChildRouter.prototype.navigateByInstruction = function (instruction, _skipLocationChange) {
        if (_skipLocationChange === void 0) { _skipLocationChange = false; }
        // Delegate navigation to the root router
        return this.parent.navigateByInstruction(instruction, _skipLocationChange);
    };
    return ChildRouter;
})(Router);
function canActivateOne(nextInstruction, prevInstruction) {
    var next = _resolveToTrue;
    if (isBlank(nextInstruction.component)) {
        return next;
    }
    if (isPresent(nextInstruction.child)) {
        next = canActivateOne(nextInstruction.child, isPresent(prevInstruction) ? prevInstruction.child : null);
    }
    return next.then(function (result) {
        if (result == false) {
            return false;
        }
        if (nextInstruction.component.reuse) {
            return true;
        }
        var hook = route_lifecycle_reflector_1.getCanActivateHook(nextInstruction.component.componentType);
        if (isPresent(hook)) {
            return hook(nextInstruction.component, isPresent(prevInstruction) ? prevInstruction.component : null);
        }
        return true;
    });
}


  function getComponentConstructor(name) {
    var serviceName = name + 'Directive';
    if ($injector.has(serviceName)) {
      var definitions = $injector.get(serviceName);
      if (definitions.length > 1) {
        throw new BaseException('too many directives named "' + name + '"');
      }
      return definitions[0].controller;
    } else {
      throw new BaseException('directive "' + name + '" is not registered');
    }
  }

  //TODO: this is a hack to replace the exiting implementation at run-time
  exports.getCanActivateHook = function (directiveName) {
    var controller = getComponentConstructor(directiveName);
    return controller.$canActivate && function (next, prev) {
      return $injector.invoke(controller.$canActivate, null, {
        $nextInstruction: next,
        $prevInstruction: prev
      });
    };
  };

  // This hack removes assertions about the type of the "component"
  // property in a route config
  exports.assertComponentExists = function () {};

  angular.stringifyInstruction = function (instruction) {
    return instruction.toRootUrl();
  };

  var RouteRegistry = exports.RouteRegistry;
  var RootRouter = exports.RootRouter;

  // Override this method to actually get hold of the child routes
  RouteRegistry.prototype.configFromComponent = function (component) {
    var that = this;
    if (isString(component)) {
      // Don't read the annotations component a type more than once –
      // this prevents an infinite loop if a component routes recursively.
      if (this._rules.has(component)) {
        return;
      }
      var controller = getComponentConstructor(component);
      if (angular.isArray(controller.$routeConfig)) {
        controller.$routeConfig.forEach(function (config) {
          var loader = config.loader;
          if (isPresent(loader)) {
            config = angular.extend({}, config, { loader: () => $injector.invoke(loader) });
          }
          that.config(component, config);
        });
      }
    }

  }

  var registry = new RouteRegistry($routerRootComponent);
  var location = new Location();

  var router = new RootRouter(registry, location, $routerRootComponent);
  $rootScope.$watch(function () { return $location.url(); }, function (path) {
    if (router.lastNavigationAttempt !== path) {
      router.navigateByUrl(path);
    }
  });

  router.subscribe(function () {
    $rootScope.$broadcast('$routeChangeSuccess', {});
  });

  return router;
}

}());
