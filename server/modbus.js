
//Required NPM Modules
let modbus = Npm.require('h5.modbus');
let serialPort = Npm.require('serialPort');
let net = Npm.require('net');


//This is our globally exported object from this package
Mmodbus = class Mmodbus {
  /**

  */
  constructor({
    scanOptions : {supressTransationErrors=true,retryOnException= false,maxConcurrentRequests= 1, defaultUnit= 1,defaultMaxRetries= 1,defaultTimeout= 1000} ={},
    rtu = { serialPort = '/dev/ttyACM0', baudRate= 9600, type= 'serial'} ={},
    ip = { type= 'tcp', host= '127.0.0.1', port= 502, autoConnect= true, autoReconnect= true, minConnectTime= 2500, maxReconnectTime= 5000} = {},
    groupOptions = {coilReadLength = 25,holdingRegisterLength = 25,maxCoilGroups = 5, maxHoldingRegisterGroups = 10}= {},
    useIP = true
  })
  {
    //Options Object
    this.options = {};
    //Options for H5 Modbus
    this.options.scanOptions = {supressTransationErrors,retryOnException, maxConcurrentRequests,defaultUnit,defaultMaxRetries,defaultTimeout};
    this.options.rtu = {serialPort,baudRate,type};
    this.options.ip = {type,host,port,autoConnect,autoReconnect,minConnectTime,maxReconnectTime};
    //Options for MModbus
    this.options.groupOptions = {coilReadLength,holdingRegisterLength,maxCoilGroups,maxHoldingRegisterGroups};
    this.options.useIP = useIP;

    //create logger
    this.logger = Logger;
    //console.log(this.options);
    //console.log(this.options.scanOptions);

    this.initialize();
  }
  initialize(){
    let masterConfig = this.createMasterConfiguration();
    //console.log(masterConfig);
    this.master = modbus.createMaster(masterConfig);


    //console.log(masterConfig);
  }
  createMasterConfiguration(){
    let transport = {}; //transport object for modbus connections
    //Will be creating a TCP IP Connection for transport object
    if(this.options.useIP){
      let socket = new net.Socket();
      transport.type = 'ip';
      transport.eofTimeout = 10;
      transport.connection = _.extend({},this.options.ip,{socket: socket});
      //console.log(transport);

    }//Will be creating a serial connection for transport object.
    else {
      let serialPort = new SerialPort(this.options.rtu.serialPort, {
        baudRate: this.options.rtu.baudRate
      });
      transport.type = 'rtu',
      transport.eofTimeout = 10;
      transport.connection = { type: this.options.rtu.type, serialPort: serialPort}
    }
    let masterConfig = _.extend({},this.options.scanOptions,{transport:transport});
    return masterConfig;
  }


}
