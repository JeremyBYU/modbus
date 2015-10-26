Package.describe({
  name: 'jeremybyu:modbus',
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
  "h5.modbus": "https://github.com/morkai/h5.modbus/archive/0993906e41429a298e91c85dda00ea663c0e9f3e.tar.gz"
});


Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use(['ecmascript','templating']);
  api.use('aldeed:collection2@2.5.0');
  //api.use('meteorhacks:npm@1.5.0','server');

  api.addFiles('models/liveTags.js');
  api.addFiles('models/scanGroups.js');
  api.addFiles('models/tag.js');
  api.addFiles('modbus.js');
  api.addFiles('util.js');
  api.export('Mmodbus')
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('jeremybyu:modbus');
  api.addFiles('tests/modbus-tests.js');
});
