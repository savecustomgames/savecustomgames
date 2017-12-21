const gulp = require('gulp');
const ejs = require('gulp-ejs');
const cssnano = require('gulp-cssnano');
const rename = require('gulp-rename');
const fs = require('fs-extra');
const path = require('path');
const pMap = require('p-map');
const yaml = require('js-yaml');
const merge = require('merge-stream');

gulp.task('html', async () => {
  const locales = (await fs.readdir('./src/localizations')).map(
    fileName => path.parse(fileName).name,
  );
  return merge(
    await pMap(locales, async locale => {
      const file = await fs.readFile(`./src/localizations/${locale}.yml`);
      const tokens = yaml.safeLoad(file);
      return gulp
        .src('./src/index.ejs')
        .pipe(
          ejs(
            { locales, currentLocale: locale, __: tokens },
            { rmWhitespace: true },
          ),
        )
        .pipe(rename(`${locale === 'default' ? 'index' : locale}.html`))
        .pipe(gulp.dest(`./dist`));
    }),
  );
});

gulp.task('styles', () =>
  gulp
    .src('./src/styles/**/*.css')
    .pipe(cssnano())
    .pipe(gulp.dest('./dist/styles')),
);

gulp.task('images', () =>
  gulp.src('./src/images/**/*').pipe(gulp.dest('./dist/images')),
);

gulp.task('watch html', () =>
  gulp.watch(
    ['./src/index.ejs', './src/localizations/*.yml'],
    gulp.task('html'),
  ),
);
gulp.task('watch styles', () =>
  gulp.watch('./src/styles/**/*.css', gulp.task('styles')),
);
gulp.task('watch images', () =>
  gulp.watch('./src/images/**/*', gulp.task('images')),
);

gulp.task('default', gulp.parallel('html', 'styles', 'images'));
gulp.task(
  'watch',
  gulp.parallel('default', 'watch html', 'watch styles', 'watch images'),
);
