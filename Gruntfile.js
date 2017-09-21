module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n',
      },
      mearm: {
        src: ['src/device-libs/mimedevice.js', 'src/device-libs/mearm.js'],
        dest: 'build/device-libs/mearm.js',
      },
      mirobot: {
        src: ['src/device-libs/mimedevice.js', 'src/device-libs/mirobot.js'],
        dest: 'build/device-libs/mirobot.js',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'build/device-libs/mearm.min.js': ['build/device-libs/mearm.js'],
          'build/device-libs/mirobot.min.js': ['build/device-libs/mirobot.js']
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'mearm.js']
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task
  grunt.registerTask('default', ['concat:mearm', 'concat:mirobot', 'uglify']);

  grunt.registerTask('test', ['jshint']);
  
};