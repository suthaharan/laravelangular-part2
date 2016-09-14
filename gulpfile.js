var elixir = require('laravel-elixir');
var gulp = require('gulp');
var rename = require('gulp-rename');

gulp.task('copyFonts', function () {
    gulp.src('resources/assets/fonts/**/*.*')
      .pipe(rename({dirname: ''}))
      .pipe(gulp.dest('public/build/fonts'));
});

elixir(function(mix) {
    mix
      .styles(["vendor/**/*.css"], "public/css/vendor.css")
      .styles(["custom/**/*.css"], "public/css/custom.css")
      .scripts([
          "vendor/jquery/jquery.js",
          "vendor/jquery-ui/jquery-ui.js",
          "vendor/bootstrap/bootstrap.js",
          "vendor/angular/angular.js",
          "vendor/angular-bootstrap/ui-bootstrap-tpls.js",
          "vendor/**/*.js"
      ], "public/js/vendor.js")
      .scripts(["custom/**/*.js"], "public/js/custom.js")
      .version(["css/custom.css", "css/vendor.css", "js/vendor.js", "js/custom.js"]);

    mix.task('copyFonts');
});
