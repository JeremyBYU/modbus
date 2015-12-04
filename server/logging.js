let Winston = Npm.require('winston');
let MongoDB = Npm.require('winston-mongodb').MongoDB;
//  let winston-mondgb = Npm.require('winston-mongodb');
let myCustomLevels = {
  levels: {
    mmodbus_silly: 0,
    mmodbus_debug: 1,
    mmodbus_info: 2,
    mmodbus_warn: 3,
    mmodbus_error: 4
  },
  colors: {
    mmodbus_silly: 'green',
    mmodbus_debug: 'green',
    mmodbus_info: 'blue',
    mmodbus_warn: 'yellow',
    mmodbus_error: 'red'
  }
};
let mongoOptions = {
  handleExceptions: false,
  level: 'mmodbus_debug',
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors,
  db: process.env.MONGO_URL,
  port: 8081,
  collection: 'mmodbus_log',
  errorTimeout: 10000,
  timeout: 50000
};
let consoleOptions = {
  level: 'mmodbus_silly',
  colorize: true,
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors
};

Logger = new (Winston.Logger)({levels: myCustomLevels.levels, colors: myCustomLevels.colors});
Logger.add(MongoDB, mongoOptions);
Logger.add(Winston.transports.Console, consoleOptions);
