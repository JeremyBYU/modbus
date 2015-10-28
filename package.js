Package.describe({
  name: 'jeremybyu:mmodbus',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Adds a Modbus Client which queries a slave and stores information in MongoDB',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/JeremyBYU/modbus.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "h5.modbus": "https://github.com/morkai/h5.modbus/archive/0993906e41429a298e91c85dda00ea663c0e9f3e.tar.gz",
  "serialport": "1.7.1",
  "winston": "1.1.1",
  "winston-mongodb": "1.2.0"
});


Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use(['ecmascript','templating']);
  api.use('aldeed:collection2@2.5.0');
  api.use(['underscore','adriancbo:chalk'],'server');

  api.addFiles('lib/models/liveTags.js');
  api.addFiles('lib/models/scanGroups.js');
  api.addFiles('lib/models/tag.js');
  api.addFiles('lib/global.js');

  api.addFiles(['server/logging.js','server/utils.js','server/modbus.js'],'server');
  api.addFiles('client/util.js','client');

  api.export('Mmodbus')
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jeremybyu:modbus');
  api.addFiles('tests/modbus-tests.js');
});
