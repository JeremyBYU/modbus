// Write your package code here!
// let scanOptionsDefault = {autostart:true,coilScanInterval:2000,supressTransationErrors:true,retryOnException: false,maxConcurrentRequests: 1, defaultUnit: 1,defaultMaxRetries: 1,defaultTimeout: 1000};
// let rtuDefault = { serialPort : '/dev/ttyACM0', baudRate: 9600, type: 'serial'};
// let ipDefault = { type: 'tcp', host: '127.0.0.1', port: 502, autoConnect: true, autoReconnect: true, minConnectTime: 2500, maxReconnectTime: 5000};
// let groupOptionsDefault = {coilReadLength : 25,holdingRegisterLength : 25,maxCoilGroups : 5, maxHoldingRegisterGroups : 10};


Mmodbus = class Mmodbus {
  constructor({
    scanOptions : {autostart = true,coilScanInterval=2000,supressTransationErrors=true,retryOnException= false,maxConcurrentRequests= 1, defaultUnit= 1,defaultMaxRetries= 1,defaultTimeout= 1000} ={},
    rtu = { serialPort = '/dev/ttyACM0', baudRate= 9600, type= 'serial'} ={},
    ip = { type= 'tcp', host= '127.0.0.1', port= 502, autoConnect= true, autoReconnect= true, minConnectTime= 2500, maxReconnectTime= 5000} = {},
    groupOptions = {coilReadLength = 25,holdingRegisterLength = 25,maxCoilGroups = 5, maxHoldingRegisterGroups = 10}= {},
    useIP = true
  })
  {
    //Options Object
    this.options = {};
    //Options for H5 Modbus
    this.options.scanOptions = {autostart,coilScanInterval,supressTransationErrors,retryOnException, maxConcurrentRequests,defaultUnit,defaultMaxRetries,defaultTimeout};
    this.options.rtu = {serialPort,baudRate,type};
    this.options.ip = {type,host,port,autoConnect,autoReconnect,minConnectTime,maxReconnectTime};
    //Options for MModbus
    this.options.groupOptions = {coilReadLength,holdingRegisterLength,maxCoilGroups,maxHoldingRegisterGroups};
    this.options.useIP = useIP;
    //TODO Consider removing these collections...
    //MongoDB Database Collections
    this.LiveTags = LiveTags;
    this.ScanGroups = ScanGroups;
    this.Tags = Tags;
  }
  static getCollections(){
    return {
      LiveTags: LiveTags,
      ScanGrups: ScanGroups,
      Tags: Tags
    }
  }


}
