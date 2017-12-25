const gulp = require('gulp');
const ejs = require('gulp-ejs');
const cssnano = require('gulp-cssnano');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs-extra');
const path = require('path');
const pMap = require('p-map');
const yaml = require('js-yaml');
const merge = require('merge-stream');
const marked = require('marked');

const renderer = new marked.Renderer();
renderer.link = (href, title, text) => {
  var out = '<a target="_blank" href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};
marked.setOptions({ renderer });

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
            {
              locales,
              currentLocale: locale,
              __: tokens,
              md: text => marked(text || ''),
            },
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
    .src([
      './src/styles/bootstrap-reboot.min.css',
      './src/styles/base.css',
      './src/styles/*.css',
    ])
    .pipe(sourcemaps.init())
    .pipe(cssnano({ discardUnused: false }))
    .pipe(concat('styles.css', { newLine: '\n\n' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist')),
);

gulp.task('images', () =>
  gulp.src('./src/images/**/*').pipe(gulp.dest('./dist/images')),
);

gulp.task('fonts', () =>
  gulp.src('./src/fonts/**/*').pipe(gulp.dest('./dist/fonts')),
);

gulp.task('watch html', () =>
  gulp.watch(
    ['./src/index.ejs', './src/localizations/*.yml'],
    gulp.task('html'),
  ),
);
gulp.task('watch styles', () =>
  gulp.watch('./src/styles/*.css', gulp.task('styles')),
);
gulp.task('watch images', () =>
  gulp.watch('./src/images/**/*', gulp.task('images')),
);
gulp.task('watch fonts', () =>
  gulp.watch('./src/fonts/**/*', gulp.task('fonts')),
);

gulp.task('default', gulp.parallel('html', 'styles', 'images', 'fonts'));
gulp.task(
  'watch',
  gulp.parallel(
    'default',
    'watch html',
    'watch styles',
    'watch images',
    'watch fonts',
  ),
);
