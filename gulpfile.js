/**
 * 初始化
 * npm install gulp-util gulp-imagemin gulp-sass gulp-minify-css gulp-uglify gulp-rename gulp-concat gulp-clean gulp-clean tiny-lr --save-dev
 */

// 引入 gulp及组件
var gulp    = require('gulp'),                 //基础库
    htmlmin = require('gulp-htmlmin'),
    imagemin = require('gulp-imagemin'),     //图片压缩
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    sass = require('gulp-ruby-sass'),
    plumber = require('gulp-plumber'),
    cssmin = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    notify = require("gulp-notify"),
    sourcemaps = require('gulp-sourcemaps'),
    spritesmith= require('gulp.spritesmith'), //生成精灵图
    rev = require('gulp-rev-append'),     //给页面的引用添加版本号，清除页面引用缓存。
    //jshint = require('gulp-jshint'),           //js检查
    uglify  = require('gulp-uglify'),          //js压缩
    rename = require('gulp-rename'),          //重命名
    concat  = require('gulp-concat'),       //合并文件
    cssver = require('gulp-make-css-url-version'), //css文件里引用url加版本号（文件MD5）
    clean = require('gulp-clean'),           //清空文件夹
    buffer = require('vinyl-buffer');
   // tinylr = require('tiny-lr'),               //livereload
    //server = tinylr(),
   // port = 35729,
    //livereload = require('gulp-livereload');   //livereload

// HTML处理
gulp.task('html', function() {
    var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    var htmlSrc = 'src/*.html',
        htmlDst = 'dist/';
    gulp.src(htmlSrc)
        .pipe(htmlmin(options))
        //.pipe(livereload(server))
        .pipe(gulp.dest(htmlDst))
});

// 样式处理
gulp.task('css', function() {
    var cssSrc = 'src/scss/main.scss',
        cssDst = 'dist/css',
        srcCss = 'src/css';
    return sass(cssSrc,{
        compass: false,
        sourcemap: true
    })
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Android >= 4.0'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove:true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(cssver()) //给css文件里引用文件加版本号（文件MD5）
        .pipe(gulp.dest(srcCss))
        .pipe(cssmin({
            advanced: false,//类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
            compatibility: 'ie7',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
            keepBreaks: false//类型：Boolean 默认：false [是否保留换行]
        }))
        .pipe(sourcemaps.write('maps', {addComment: false}))
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        //.pipe(filter) // Don’t write sourcemaps of sourcemaps

        //.pipe(filter.restore) // Restore original files
        .pipe(gulp.dest(cssDst));
});

// 图片处理
gulp.task('images', function(){
    var imgSrc = './src/img/**/*',
        imgDst = './dist/img';
    gulp.src(imgSrc)
        .pipe(cache(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
            use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        })))
        //.pipe(livereload(server))
        .pipe(gulp.dest(imgDst));

});

 // 精灵图
 var sprites= {
     src:  './src/img/sprites/icon/*.png',
     dist: './dist/img',
     dest: {
         css:  './src/scss/base/',
         image:  './src/img/sprites'
     },
    options: {
        cssName: '_sprites.scss',
        cssFormat: 'css',
        cssOpts: {
            cssClass: function (item) {
                // If this is a hover sprite, name it as a hover one (e.g. 'home-hover' -> 'home:hover')
                if (item.name.indexOf('-hover') !== -1) {
                    return '.icon-' + item.name.replace('-hover', ':hover');
                    // Otherwise, use the name as the selector (e.g. 'home' -> 'home')
                } else {
                    return '.icon-' + item.name;
                }
            }
        },
        imgName: 'icon-sprite.png',
        imgPath: '../img/icon-sprite.png'
    }
};
gulp.task('sprite',function(){
    var spriteData = gulp.src(sprites.src).pipe(spritesmith(sprites.options));
         spriteData.img
        .pipe(gulp.dest(sprites.dest.image));
         spriteData.css
        .pipe(gulp.dest(sprites.dest.css));
});
// js处理
gulp.task('js', function () {
    var mainSrc = 'src/js/main.js',
        mainDst = 'dist/js/',
        appSrc = 'src/js/vendor/*.js',
        appDst = 'dist/js/vendor/';

    gulp.src(mainSrc)
        //.pipe(jshint('.jshintrc'))
        //.pipe(jshint.reporter('default'))
        //.pipe(concat('main.js'))
        //.pipe(gulp.dest(jsDst))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(mainDst));
        //.pipe(livereload(server));

    gulp.src(appSrc)
        .pipe(uglify())
        .pipe(concat("vendor.min.js"))
        .pipe(gulp.dest(appDst));
        //.pipe(livereload(server));
});
//给页面引用url添加版本号，以清除页面缓存
//gulp-rev-append插件将通过正则(?:href|src)=”(.*)[?]rev=(.*)[“]查找并给指定链接填加版本号（默认根据文件MD5生成，因此文件未发生改变，此版本号将不会变 ?rev=@@hash）
gulp.task('testRev', function () {
    gulp.src('src/*.html')
        .pipe(rev())
        .pipe(gulp.dest('dist'));
});
// 清空图片、样式、js
gulp.task('clean', function() {
    gulp.src(['dist/css','dist/js','src/css', 'dist/img','dist/*.html'], {read: false})
        .pipe(clean());
});
// 默认任务 清空图片、样式、js并重建 运行语句 gulp
gulp.task('default', ['clean'], function(){
    gulp.start('html','css','images','js');
});
// 监听任务 运行语句 gulp watch
gulp.task('watch',function(){

        // 监听html
        gulp.watch('src/*.html', function(event){
            gulp.run('html');
        });

        // 监听css
        gulp.watch('src/scss/*.scss', function(){
            gulp.run('css');
        });

        // 监听images
        gulp.watch('src/img/*', function(){
            gulp.run('images');
        });

        // 监听js
        gulp.watch('src/js/*.js', function(){
            gulp.run('js');
        });


});
