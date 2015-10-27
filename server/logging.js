let Winston = Npm.require('winston');
let MongoDB = Npm.require('winston-mongodb').MongoDB;
//let winston-mondgb = Npm.require('winston-mongodb');
let myCustomLevels = {
  levels: {
    Mmodbus_info: 0,
    Mmodbus_warn: 1,
    Mmodbus_error: 2
  },
  colors: {
    Mmodbus_info: 'blue',
    Mmodbus_warn: 'yellow',
    Mmodbus_error: 'red'
  }
};
let mongoOptions = {
  handleExceptions: false,
  level: 'Mmodbus_info',
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors,
  db: process.env.MONGO_URL,
  port: 8081,
  collection: 'mmodbus_log',
  errorTimeout: 10000,
  timeout: 50000
  };
let consoleOptions = {
  level: 'Mmodbus_warn',
  colorize: true,
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors
};

Logger = new (Winston.Logger)({levels: myCustomLevels.levels,colors:myCustomLevels.colors});
Logger.add(MongoDB,mongoOptions);
Logger.add(Winston.transports.Console,consoleOptions);
