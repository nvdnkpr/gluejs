var path = require('path');

var spawn = require('../../file-tasks/spawn.js'),
    wrapCommonJs = require('../../file-tasks/wrap-commonjs-web.js'),
    wrapJson = require('../../file-tasks/wrap-json-web.js'),
    wrapExports = require('../../file-tasks/wrap-exports-web.js');

module.exports = function(options) {
  var result = [],
      useDefaults = true;

  // 1st: any custom commands (in array order)
  // 2nd: any wrapping
  // 3rd: any reporting

  // the expected result is one of (sync(input), async(input, done), fn() { return stream | child process } )
  // getFileTasks will call the function once with the item as the param
  // --> TODO in the future might want to just combine these two as the syntax is a bit awkward

  if (Array.isArray(options.command)) {
    result = options.command;
  } else if(options.command) {
    // "simple mode": one --command which only applies to .js files
    result.push({
      ext: '.js',
      task: function(item) {
        // extra level of nesting is annoying, but it avoids having to instantiate the task resources immediately
        return function() {
          return spawn({
            name: item.name, // full path
            task: options.command
          });
        };
      }
    });
  }

  var exportVariableName = options['export'] || 'foo';

  if (useDefaults) {
    // default task for wrapping .js
    result.push({
      ext: '.js',
      task: function(item, packageObj) {
        var relname = path.relative(packageObj.basepath, item.name);
        return function() {
          return wrapCommonJs({
            'source-url': options['source-url'],
            'name': (packageObj.name ? exportVariableName+'/' + packageObj.name + '/' : exportVariableName+'/')  + relname
          });
        };
      }
    });
    // default task for wrapping .json
    result.push({
      ext: '.json',
      task: function() {
        return function() {
          return wrapJson({ });
        };
      }
    });
    // if we are reporting, add the stream size capture task at the end
    // so we can report on results (e.g. of minification)
    if (options.command && options.report) {
      result.push({
        ext: '.js',
        task: function() {
          return streamSize({
            onDone: function(size) {
                packageObj.files[innerCurrent].sizeAfter = size;
            }
          });
        }
      });
    }
    // this would be a good place to add more default tasks
  }
  return result;
};