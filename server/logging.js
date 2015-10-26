let Winston = Npm.require('winston');
let MongoDB = Npm.require('winston-mongodb').MongoDB;
//let winston-mondgb = Npm.require('winston-mongodb');
let myCustomLevels = {
  levels: {
    m_info: 0,
    m_warn: 1,
    m_error: 2
  },
  colors: {
    m_info: 'blue',
    m_warn: 'yellow',
    m_error: 'red'
  }
};
let mongoOptions = {
  handleExceptions: true,
  level: 'm_info',
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors,
  db: process.env.MONGO_URL,
  port: 8081,
  collection: 'mmodbus_log',
  errorTimeout: 10000,
  timeout: 50000
  };
let consoleOptions = {
  level: 'm_warn',
  colorize: true,
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors
};

Logger = new (Winston.Logger)({levels: myCustomLevels.levels,colors:myCustomLevels.colors});
Logger.add(MongoDB,mongoOptions);
Logger.add(Winston.transports.Console,consoleOptions);
