
app.directive('input', function() {
  return {
    restrict: 'E',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {
        if ('type' in attrs && attrs.type.toLowerCase() === 'range') {
            ngModel.$parsers.push(parseFloat);
        }
    }
  };
});


app.directive('subnav', function() {
  return {
    restrict: 'EA',
    replace:true,
    scope: {
      title: '@',
    },
    transclude:true,
    templateUrl: 'templates/subnav.html',
    link: function(scope, element, attrs) {
    }
  };
});

app.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}])