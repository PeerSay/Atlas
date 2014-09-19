module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
        //cfg: grunt.file.readJSON('config.json'),

        // Tasks
        watch: {
            test: {
                options: {
                    livereload: 35729,
                    spawn: false
                },
                files: [
                    'Gruntfile.js',
                    'static/**/*.*'
                ]
            }
        }
        /*,
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: '<%= connect.options.livereload %>'
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        'static/'
                    ]
                }
            }
        }*/
    });

    grunt.registerTask('dev', [/*'connect:livereload',*/ 'watch']);
    grunt.registerTask('default', ['dev']);
};
