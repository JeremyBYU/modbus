// Write your package code here!
let scanOptionsDefault = {autostart:true,coilScanInterval:2000,supressTransationErrors:true,retryOnException: false,maxConcurrentRequests: 1, defaultUnit: 1,defaultMaxRetries: 1,defaultTimeout: 1000};
let rtuDefault = { serialPort : '/dev/ttyACM0', baudRate: 9600, type: 'serial'};
let ipDefault = { type: 'tcp', host: '127.0.0.1', port: 502, autoConnect: true, autoReconnect: true, minConnectTime: 2500, maxReconnectTime: 5000};
let groupOptionsDefault = {coilReadLength : 25,holdingRegisterLength : 25,maxCoilGroups : 5, maxHoldingRegisterGroups : 10};

var s = 'test';
Mmodbus = class Mmodbus {
  constructor({
    scanOptions = scanOptionsDefault,
    rtu = rtuDefault,
    ip = ipDefault,
    useIP = true,
    groupOptions = groupOptionsDefault
  })
  {
    //Options Object
    this.options = {};
    //Options for H5 Modbus
    this.options.scanOptions = Object.assign({},scanOptionsDefault,scanOptions)
    this.options.rtu = Object.assign({},rtuDefault,rtu);
    this.options.ip = Object.assign({},ipDefault,ip);
    //Options for MModbus
    this.options.useIP = useIP;
    this.options.groupOptions = Object.assign({},groupOptionsDefault,groupOptions);

    //MogoDB Database Collections
    this.Tags = Tags;
  }


}
// let cordsDefaults = {x: 0, y: 0};
// function drawES6Chart(
//   {size = 'big', cords = cordsDefaults, radius = 25} = {}
//   )
// {
//   cords = Object.assign({}, cordsDefaults, cords);
//   console.log(size, cords, radius);
//   // do some chart drawing
// }
// drawES6Chart({cords: {x:18}});

// function drawES6Chart({size = 'big', cords = { x: 0, y: 0 }, radius = 25} = {})
// {
//   console.log(size, cords, radius);
//   // do some chart drawing
// }
//
// drawES6Chart({
//   cords: { x: 18, y: 30 },
//   radius: 30
// });


env_windows = true;

//
// //Contains options for connection options
// connection = {};
// connection.modbus =
// {
//     coilReadLength: 25,
//     holdingRegisterLength: 25,
//     maxCoilGroups: 5,
//     maxHoldingRegisterGroups: 10
// };
//
// connection.options = {
//     autostart: true,
//     coilScanInterval: 2000,
//     suppressTransactionErrors: true,
//     retryOnException: false,
//     maxConcurrentRequests: 1,
//     defaultUnit: 1,
//     defaultMaxRetries: 1,
//     defaultTimeout: 1000,
//
//     rtu:{
//     	serialPort : '/dev/ttyACM0',
//     	baudRate: 9600,
//     	type: 'serial'
//
//     },
//
//     ip:{
//     	type: 'tcp',
//     	host: '127.0.0.1',
//     	port: 502,
//     	autoConnect: true,
//     	autoReconnect: true,
//     	minConnectTime: 2500,
//     	maxReconnectTime: 5000
//     }
// };
