
//Required NPM Modules
let modbus = Npm.require('h5.modbus');

//This is our globally exported object from this package
Mmodbus = class Mmodbus {
  /**
   * Constructor for Mmodbus Object.  Pass in configuraton objects
   *
   * @param {String} event
   *
   * @param {Function} cb
   *
   * @returns {Object} Provdes MModbus object
   */
  constructor({
    scanOptions : {supressTransationErrors=true,retryOnException= false,maxConcurrentRequests= 1, defaultUnit= 1,defaultMaxRetries= 1,defaultTimeout= 1000} ={},
    rtu : { serialPort = '/dev/ttyACM0', baudRate= 9600, type= 'serial'} ={},
    ip : { type= 'tcp', host= '127.0.0.1', port= 502, autoConnect= true, autoReconnect= true, minConnectTime= 2500, maxReconnectTime= 5000} = {},
    groupOptions : {coilReadLength = 25,holdingRegisterLength = 25,maxCoilGroups = 5, maxHoldingRegisterGroups = 10}= {},
    useIP = true,
    scanInterval = 5000
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
    this.options.scanInterval = scanInterval;

    //create logger
    this.logger = Logger;
    //Add Colleciton Reference
    this.collections = {LiveTags: LiveTags,ScanGrups: ScanGroups,Tags: Tags};
    //console.log(this.options);
    //console.log(this.options.scanOptions);
    //placeholder for the Meteor Timers
    this.modbus_timer = null;
    this.initialize();
  }
  /**

  */
  initialize(){
    self = this;
    let masterConfig = Utils.createMasterConfiguration(self);
    //console.log(masterConfig);
    self.master = modbus.createMaster(masterConfig);

    //Generate basic event handling for master connections
    self.createEvents();

    //Configure Modbus Collections 'Live Tags' & 'Scan Groups'
    self.configureModbusCollections();

    //self.startAllScanning();
    //console.log(masterConfig);
  }
  createEvents(){
    let self = this;
    Utils.syncMasterOn(self,'error', (err) => {
      self.logger.Mmodbus_error('[master#error] %s', err.message);
      //stopAllScanning();
    });
    Utils.syncMasterOn(self,'disconnected', () => {
      self.logger.Mmodbus_warn('[master#disconnected]');
      //stopAllScanning();
      //TODO Stop all Timers!
    });
    //asyncMaster('connected',function(){console.log('test');});
    Utils.syncMasterOn(self,'connected', () => {
      self.logger.Mmodbus_info('[master#connected]');
      self.logger.Mmodbus_info('Beggining Scanning of Coils');
      self.startAllScanning();
    });
  }
  resetLiveTags(){
    LiveTags.remove({});
  }
  resetScanGroups(){
    ScanGroups.remove({});
  }
  configureModbusCollections() {
    let self = this;
    //Clear the Live Tag Collection
    self.resetLiveTags();
    self.configureLiveTagCollection();

    //Clear the Scan Group Collection
    self.resetScanGroups();

    self.configureModbusCoilCollections();
    self.configureModbusHoldingRegisterCollections();

  }
  configureLiveTagCollection() {
    //return array of all Tags
    var allTags = Tags.find({}, {
        fields: {
            'tag': 1,
            'description': 1,
            'params': 1
        }
    }).fetch();
    //Loop through each tag
    _.each(allTags, function(tag) {
      //Loop through each Parameter
        _.each(tag.params, function(param) {
            var tag_param = tag.tag + '_' + param.name;
            var new_livetag = {
                tagid: tag._id,
                tag_param: tag_param,
                description: tag.description,
                value: 0
            };
            LiveTags.insert(new_livetag);
        });
    });
  }
/**
 * This wil create the Scan Group Collections from the Tags collection which have coils
*/
  configureModbusCoilCollections() {
    //Get a list of all coils (neeed address, tag_id, tag_param)
    let allCoils = Tags.find({
        "params.table": "Coil"
    }, {
        fields: {
            'tag': 1,
            'params': 1
        }
    }).fetch();
    //unfortunately this new Array has more than just coils, will need to clean it up
    //New array just containg the coils and their addess.
    let cleanCoils = new Array();
    _.each(allCoils, (tag) => {
      _.each(tag.params, (param) => {
        if (param.table == "Coil") {
          let tag_param = tag.tag + '_' + param.name;
          let new_coil = {
            tagid: tag._id,
            tag_param: tag_param,
            address: param.address
          };
          cleanCoils.push(new_coil);
        }
      });
    });
    //create Scan Groups here
    Utils.createScanGroup(cleanCoils,this.options.groupOptions.maxCoilGroups,this.options.groupOptions.coilReadLength,"Coil")

  }
  configureModbusHoldingRegisterCollections(){
    //make two Scan Groups, one that hold integers and one that holds floating points.
    //Get a list of all Holding Registers (neeed address, tag_id, tag_param)
    let allHoldingRegisters = Tags.find({
        "params.table": "Holding Register"
    }, {
        fields: {
            'tag': 1,
            'params': 1
        }
    }).fetch();

    //New array just containg the Integers and their addesses
    let cleanIntegers = new Array();
    //New array just containing the Floating Points and their addresses.
    let cleanFloats = new Array();
    _.each(allHoldingRegisters, (tag) => {
      //console.log(tag);
      _.each(tag.params, function(param) {
        if (param.table == "Holding Register") {
          //Maybe separate floating and integer
          let tag_param = tag.tag + '_' + param.name;
          let new_number = {
            tagid: tag._id,
            tag_param: tag_param,
            address: param.address
          };
          if(param.dataType == "Integer"){
            cleanIntegers.push(new_number);
          }
          else if(param.dataType == "Floating Point") {
            cleanFloats.push(new_number);
          }
        }

      });
    });
    //create Scan Groups here
    Utils.createScanGroup(cleanIntegers,this.options.groupOptions.maxHoldingRegisterGroups,this.options.groupOptions.holdingRegisterLength,"Integer");
    Utils.createScanGroup(cleanFloats,this.options.groupOptions.maxHoldingRegisterGroups,this.options.groupOptions.holdingRegisterLength,"Floating Point");
  }

  startAllScanning() {
    if (this.modbus_timer == null) {
      this.logger.Mmodbus_warn('Creating Scan timer for scan groups');
      this.modbus_timer = Meteor.setInterval(this.scanAllGroups.bind(this), this.options.scanInterval);
    } else {
      this.logger.Mmodbus_warn('Timer already exists for scan groups');
    }
  }
  scanAllGroups() {
    let self = this;
    self.logger.Mmodbus_debug('Begin Scanning All Groups');

    var scanGroups = ScanGroups.find({
      "active": true
    }).fetch();
    self.logger.Mmodbus_debug('scanGroups Array:', scanGroups);
    _.each(scanGroups, function(myGroup) {
      switch (myGroup.table) {
        case "Coil":
          self.scanCoilGroup(myGroup);
          break;
        case "Integer":
          //scanIntegerGroup(myGroup);
          break;
        case "Floating Point":
          break;
        default:
          self.logger.Mmodbus_warn("ScanGroup ID: " + myGroup.groupNum + " has incorrect table Name");
      }
    });
    //console.log('After each statement');
  }
  scanCoilGroup(scanGroup) {
    let self = this;
    //console.log(scanGroup);
    this.logger.Mmodbus_debug("Scanning Group # ", scanGroup.groupNum);
    var address = scanGroup.startAddress;
    var quantity = scanGroup.endAddress - address;
    this.logger.Mmodbus_debug("Address and length " + address + '  ' + quantity);
    coil_response = self.readCoils(address, quantity, scanGroup);
    //console.log('scan Group response ', coil_response);
    this.logger.Mmodbus_debug('after read coil of Group', scanGroup.groupNum);
  }
  readCoils(coil_address, quantity, scanGroup){
    let self = this;
    //Neccessary Evil for Asychronous Transaction!
    transaction = self.master.readCoils(coil_address, quantity);
    transaction.setMaxRetries(0);

    Utils.SyncTransactionOn(transaction,'timeout', function() {
      this.logger.Mmodbus_info('[transaction#timeout] Scan Group #:', scanGroup.groupNum);
    });
    //TODO What should I really do on error here?
    Utils.SyncTransactionOn(transaction,'error', function(err) {
      self.logger.Mmodbus_error('[transaction#error] Scan Group #: ' + scanGroup.groupNum + '.  Err Msg: ' + err.message);
      //stopAllScanning();
    });
    Utils.SyncTransactionOn(transaction,'complete', function(err, response) {
      //if an error occurs, could be a timeout
      if (err) {
        self.logger.Mmodbus_warn('Error Message on Complete w/ ScanGroup #:', scanGroup.groupNum)
        self.logger.Mmodbus_warn(err.message);

      } else
      if (response.isException()) {
        self.logger.Mmodbus_error('Got an Exception Message. Scan Group #:', scanGroup.groupNum)
        self.logger.Mmodbus_error(response.toString());
        self.reportModbusError(scanGroup);
      } else {
        var coils;
        self.logger.Mmodbus_debug('Succesfully completed scanning of Scan Group #:', scanGroup.groupNum);
        //update LiveTags from the response and scanGroup
        coils = response.getStates().map(Number);
        console.log('Response: ' + coils);
        self.updateLiveTags(coils, scanGroup);
        //console.log(response.getStates().map(Number));
        return coils;
      }
    });
  }
  reportModbusError(scanGroup) {
    let self = this;
    let errors = ScanGroups.find({
       _id: scanGroup._id
    }).fetch()[0].errorCount;
    errors = errors + 1;
    self.logger.Mmodbus_warn('Scan Group #' + scanGroup.groupNum + ' is reporting an error. They currently have ' + errors + ' errors');
    if (errors > self.options.scanOptions.defaultMaxRetries) {
      self.logger.Mmodbus_warn('Exceeded Max Retries, disabling group #', scanGroup.groupNum);
      ScanGroups.update({_id: scanGroup._id}, {$set: {active: false}});
    }
    ScanGroups.update({_id: scanGroup._id}, {$inc: {errorCount: 1}});

  }
  updateLiveTags(data, scanGroup) {
    let self = this;
    let startAddress = scanGroup.startAddress;
    _.each(scanGroup.tags, (tag)=> {
      var index = tag.address - startAddress;
      //console.log('tag.address: '+ tag.address + ' . startArddress: ' + startAddress);
      var tagName = tag.tag_param;
      var newValue = data[index];
      self.logger.Mmodbus_debug('Updating Tag ' + tagName + ' to value of ' + newValue);
      LiveTags.update({tag_param: tagName}, {$set: {value: newValue,quality: true}});
    });
  }


}
