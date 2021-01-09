const project_folder = require('path').basename(__dirname);
const source_folder = "#src";
const { init } = require('browser-sync');
const fs = require('fs');
const { webpack } = require('webpack');
const webpackStream = require('webpack-stream');


const path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css",
        js: project_folder + "/js",
        fonts: project_folder + "/fonts",
        img: project_folder + "/img"
    },

    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/main.js",
        fonts: source_folder + "/fonts/*.ttf",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },

    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    clean: "./" + project_folder + "/"
};

const {
    src,
    dest
} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create();
fileinclude = require('gulp-file-include');
del = require('del');
scss = require('gulp-sass');
autoprefixer = require('gulp-autoprefixer');
group_media = require('gulp-group-css-media-queries');
clean_css = require('gulp-clean-css');
rename = require('gulp-rename');
clean_js = require('gulp-uglify-es').default;
imagemin = require("gulp-imagemin");
webp = require('gulp-webp');
webphtml = require('gulp-webp-html');
webpcss = require('gulp-webp-css');
svgSprite = require('gulp-svg-sprite');
ttf2woff = require('gulp-ttf2woff');
ttf2woff2 = require('gulp-ttf2woff2');
fonter = require('gulp-fonter');
webPack = require('webpack');
webPackStream = require('webpack-stream');
sourcemaps = require('gulp-sourcemaps');

//=======================Development mode===============================//

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false
    });
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude({
            prefix: '@'
        }))
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}

function css() {
    return src(path.src.css)
        .pipe(sourcemaps.init())
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 version"],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(sourcemaps.write())
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}

function js() {
    return src(path.src.js)
        .pipe(sourcemaps.init())
        .pipe(webPackStream({
            output: {
                filename: 'script.min.js'
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            },
            mode: 'production',
        }))
        .pipe(sourcemaps.write())
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                interlaced: true,
                optimizationLevel: 3,
                svgoPlugins: [{
                    removeViewBox: false
                }]
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));

    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}
function otf2ttf() {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest([source_folder + '/fonts/TTF/']));
}

function svgSprites() {
    return gulp.src([source_folder + '/sprites/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg",
                    example: true
                }
            },
        }
        ))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

function fontsStyle(done) {

    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() { }

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

var dev = gulp.series(clean, gulp.parallel(html,css,js,images, fonts, fontsStyle, svgSprites, watchFiles, browserSync), otf2ttf);
//======================================================================//
//=========================Production Mode==============================//


function cssProd() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 version"],
                cascade: true
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
}

function jsProd() {
    return src(path.src.js)
        .pipe(webPackStream({
            output: {
                filename: 'script.min.js'
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            },
            mode: 'production',
        }))
        .pipe(dest(path.build.js))
}

function svgSpritesProd() {
    return gulp.src([source_folder + '/sprites/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg",
                    example: false
                }
            },
        }
        ))
        .pipe(dest(path.build.img))
}

var prod = gulp.series(clean, gulp.parallel(html, cssProd, jsProd, images, fonts, svgSpritesProd));
//======================================================================//

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.dev = dev;
exports.default = dev;
exports.otf2ttf = otf2ttf;
exports.svgSprites = svgSprites;
exports.cssProd = cssProd;
exports.jsProd = jsProd;
exports.svgSpritesProd = svgSpritesProd;
exports.prod = prod;

