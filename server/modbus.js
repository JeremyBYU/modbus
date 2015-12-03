
//  Required NPM Modules
let modbus = Npm.require('h5.modbus');

//  This is our globally exported object from this package
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
    scanOptions: {supressTransationErrors = true, retryOnException = false, maxConcurrentRequests = 1, defaultUnit = 1, defaultMaxRetries = 1, defaultTimeout = 1000} = {},
    rtu: { serialPort = '/dev/ttyACM0', baudRate = 9600, type = 'serial'} = {},
    ip: { type = 'tcp', host = '127.0.0.1', port = 502, autoConnect = true, autoReconnect = true, minConnectTime = 2500, maxReconnectTime = 5000} = {},
    groupOptions: {coilReadLength = 25, holdingRegisterLength = 25, maxCoilGroups = 5, maxHoldingRegisterGroups = 10} = {},
    useIP = true,
    scanInterval = 5000
  }) {
    //  Options Object
    this.options = {};
    //  Options for H5 Modbus
    this.options.scanOptions = {supressTransationErrors, retryOnException, maxConcurrentRequests, defaultUnit, defaultMaxRetries, defaultTimeout};
    this.options.rtu = {serialPort, baudRate, type};
    this.options.ip = {type, host, port, autoConnect, autoReconnect, minConnectTime, maxReconnectTime};
    //  Options for MModbus
    this.options.groupOptions = {coilReadLength, holdingRegisterLength, maxCoilGroups, maxHoldingRegisterGroups};
    this.options.useIP = useIP;
    this.options.scanInterval = scanInterval;

    //  create logger
    this.logger = Logger;
    //  Add Colleciton Reference
    this.collections = {LiveTags: LiveTags, ScanGrups: ScanGroups, Tags: Tags};
    //  console.log(this.options);
    //  console.log(this.options.scanOptions);
    //  placeholder for the Meteor Timers
    this.modbus_timer = null;
    this.initialize();
  }
  /**

  */
  initialize() {
    let self = this;
    let masterConfig = Utils.createMasterConfiguration(self);
    //  console.log(masterConfig);
    self.master = modbus.createMaster(masterConfig);

    //  Generate basic event handling for master connections
    //  console.time('createMasterEvents')
    self.createMasterEvents();
    //  console.timeEnd('createMasterEvents')
    //  Configure Modbus Collections 'Live Tags' & 'Scan Groups'
    //  console.time('configureModbusCollections')
    self.configureModbusCollections();
    //  console.timeEnd('configureModbusCollections')

    //  self.startAllScanning();
    //  console.log(masterConfig);
  }
  createMasterEvents() {
    let self = this;
    Utils.syncMasterOn(self, 'error', (err) => {
      self.logger.Mmodbus_error('[master#error] %s', err.message);
      self.stopAllScanning();
    });
    Utils.syncMasterOn(self, 'disconnected', () => {
      self.logger.Mmodbus_warn('[master#disconnected]');
      self.stopAllScanning();
    });
    //  asyncMaster('connected',function(){console.log('test');});
    Utils.syncMasterOn(self, 'connected', () => {
      self.logger.Mmodbus_info('[master#connected]');
      self.logger.Mmodbus_info('Beggining Scanning of Coils');
      self.startAllScanning();
    });
  }
  resetLiveTags() {
    LiveTags.remove({});
  }
  resetScanGroups() {
    ScanGroups.remove({});
  }
  configureModbusCollections() {
    let self = this;
    //  Clear the Live Tag Collection
    //  console.time('resetLiveTags')
    self.resetLiveTags();
    //  console.timeEnd('resetLiveTags')
    //  console.time('configureLiveTagCollection')
    self.configureLiveTagCollection();
    //  console.timeEnd('configureLiveTagCollection')

    //  Clear the Scan Group Collection
    //  console.time('resetScanGroups')
    self.resetScanGroups();
    //  console.timeEnd('resetScanGroups')
    //  console.time('configureModbusCoilCollections')
    self.configureModbusCoilCollections();
    //  console.timeEnd('configureModbusCoilCollections')
    //  console.time('configureModbusHoldingRegisterCollections')
    self.configureModbusHoldingRegisterCollections();
    //  console.timeEnd('configureModbusHoldingRegisterCollections')
  }
  configureLiveTagCollection() {
    //  return array of all Tags
    //  console.time('getAllTags');
    var allTags = Tags.find({}, {
      fields: {
        'tag': 1,
        'description': 1,
        'params': 1
      }
    }).fetch();
    //  console.timeEnd('getAllTags');
    //  Loop through each tag
    //  console.time('createAllLiveTags');
    let liveTagCollection = [];
    _.each(allTags, function(tag) {
      //    Loop through each Parameter
      _.each(tag.params, function(param) {
        let tagParam = tag.tag + '_' + param.name;
        let newLivetag = {
          tagid: tag._id,
          tag_param: tagParam,
          description: tag.description,
          modifiedAt: Date(),
          value: 0
        };
        liveTagCollection.push(newLivetag);
        //  LiveTags.insert(new_livetag);
      });
    });
    LiveTags.batchInsert(liveTagCollection);
    //  console.timeEnd('createAllLiveTags');
  }
/**
 * This wil create the Scan Group Collections from the Tags collection which have coils
*/
  configureModbusCoilCollections() {
    //  Get a list of all coils (neeed address, tag_id, tag_param)
    let allCoils = Tags.find({"params.table": "Coil"}, {fields: {'tag': 1, 'params': 1}}).fetch();
    //  unfortunately this new Array has more than just coils, will need to clean it up
    //  New array just containg the coils and their addess.
    let cleanCoils = [];
    _.each(allCoils, (tag) => {
      _.each(tag.params, (param) => {
        if (param.table === "Coil") {
          let tagParam = tag.tag + '_' + param.name;
          let newCoil = {tagid: tag._id, tag_param: tagParam, address: param.address};
          cleanCoils.push(newCoil);
        }
      });
    });
    //  create Scan Groups here
    Utils.createScanGroups(Utils.assignScanGroup(cleanCoils, this.options.groupOptions.coilReadLength, "Bit"));
  }
  configureModbusHoldingRegisterCollections() {
    //  make two Scan Groups, one that hold integers and one that holds floating points.
    //  Get a list of all Holding Registers (neeed address, tag_id, tag_param)
    let allHoldingRegisters = Tags.find({"params.table": "Holding Register"}, {fields: {'tag': 1, 'params': 1}}).fetch();
    //  New array just containg the Integers and their addesses
    let cleanIntegers = [];
    //  New array just containing the Floating Points and their addresses.
    let cleanFloats = [];
    _.each(allHoldingRegisters, (tag) => {
      _.each(tag.params, (param) => {
        if (param.table === "Holding Register") {
          let tagParam = tag.tag + '_' + param.name;
          let newNumber = {tagid: tag._id, tag_param: tagParam, address: param.address};
          if (param.dataType === "Integer") {
            cleanIntegers.push(newNumber);
          } else if (param.dataType === "Floating Point") {
            cleanFloats.push(newNumber);
          }
        }
      });
    });
    //  Create Scan Groups here
    Utils.createScanGroups(Utils.assignScanGroup(cleanIntegers, this.options.groupOptions.holdingRegisterLength, "Integer"));
    Utils.createScanGroups(Utils.assignScanGroup(cleanFloats, this.options.groupOptions.holdingRegisterLength, "Floating Point"));
  }

  startAllScanning() {
    if (this.modbus_timer === null) {
      this.logger.Mmodbus_info('Creating Scan timer for scan groups');
      this.modbus_timer = Meteor.setInterval(this.scanAllGroups.bind(this), this.options.scanInterval);
    } else {
      this.logger.Mmodbus_info('Timer already exists for scan groups');
    }
  }
  stopAllScanning() {
    this.logger.Mmodbus_warn('Stopping all scanning');
    if (this.modbus_timer !== null) {
      Meteor.clearInterval(this.modbus_timer);
      //  set timer to null indicating it is no longer active
      this.modbus_timer = null;
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
      self.scanGroup(myGroup);
    });
    //  console.log('After each statement');
  }
  scanGroup(scanGroup) {
    let self = this;
    //  console.log(scanGroup);
    this.logger.Mmodbus_debug("Scanning Group # " +scanGroup.groupNum + ' of Data Type ' + scanGroup.dataType);
    let address = scanGroup.startAddress;
    let quantity = scanGroup.quantity;
    this.logger.Mmodbus_debug("Address " + address + ' and length ' + quantity);
    transaction = {};
    switch (scanGroup.dataType) {
    case "Bit":
      transaction = self.master.readCoils(address, quantity);
      break;
    case "Integer":
      transaction = self.master.readHoldingRegisters(address, quantity);
      break;
    case "Floating Point":
      transaction = self.master.readHoldingRegisters(address, quantity);
      break;
    default:
      self.logger.Mmodbus_warn("ScanGroup ID: " + scanGroup.groupNum + " has incorrect Data Type");
    }
    transaction.setMaxRetries(0);
    Utils.syncTransactionOn(transaction, 'timeout', function() {
      self.logger.Mmodbus_info('[transaction#timeout] Scan Group #:', scanGroup.groupNum);
    });
    //  TODO What should I really do on error here?
    Utils.syncTransactionOn(transaction, 'error', function(err) {
      self.logger.Mmodbus_error(`[transaction#error] ${scanGroup.groupNum} of DataType ${scanGroup.dataType}` +  'Err Msg: ' + err.message);
      //  stopAllScanning();
    });
    Utils.syncTransactionOn(transaction, 'complete', function(err, response) {
      //  if an error occurs, could be a timeout
      if (err) {
        self.logger.Mmodbus_warn(`Error Message on Complete w/ ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`)
        self.logger.Mmodbus_warn(err.message);
      } else if (response.isException()) {
        self.logger.Mmodbus_error(`Got an Exception Message. Scan Group #: ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`)
        self.logger.Mmodbus_error(response.toString());
        self.reportModbusError(scanGroup);
      } else {
        self.logger.Mmodbus_debug(`Succesfully completed scanning of Scan Group #: ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`);
        //  update LiveTags from the response and scanGroup
        self.handleRespone(response, scanGroup);
      }
    });
  }
  /**
   * This funciton will hande a response from a transaction. The updated tag data is evaluated from the response
   * and the MongoDB collection LiveTags is updated
   * @param {Object} response - This is Response object from a transaction.
   *
   * @param {Object} scanGroup - This is the scanGroup object for the transaction
   *
   */
  handleRespone(response, scanGroup) {
    let self = this;
    let data;

    data = (scanGroup.dataType === "Bit") ? response.getStates().map(Number) : response.getValues();
    //  self.logger.Mmodbus_debug('Scan Group Data for Group#:', scanGroup.table,scanGroup.groupNum);
    //  console.log(data);
    //  self.logger.Mmodbus_debug('test', data);
    _.each(scanGroup.tags, (tag)=> {
      var index = tag.address - scanGroup.startAddress;
      var tagName = tag.tag_param;
      var newValue = (scanGroup.dataType === "Bit") ? data[index] : self.readTypedValue(scanGroup.dataType, scanGroup.startAddress, tag, data);
      //  console.log('Returned new Value: ',newValue);
      self.logger.Mmodbus_silly('Updating Tag ' + tagName + ' at address ' + tag.address + ' to value of ' + newValue);
      LiveTags.update({tag_param: tagName}, {$set: {value: newValue, quality: true, modifiedAt: new Date()}});
    });
  }
  /**
   * This will function will report a Modbus error on scan group.  If too many erros occur, the scan group will be
   * made inactive.
   *
   */
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
  /**
   * Read data from a buffer based upon the data type
   *
   * @param {String} dataType - The dataType repersents the datatype, e.g. Integer
   *
   * @param {Number} startingAddress - The address to begin reading with in the buffer
   *
   * @param {Object} tag - Tag object
   *
   * @param {BUFFER} buffer - Buffer Object, from response of transaction
   *
   *@return {Number} - Returns the number from the buffer
   */
  readTypedValue(dataType,startingAddress, tag, buffer) {
    let offset = (tag.address - startingAddress) * 2;
    //  self.logger.Mmodbus_debug("reading Tag.param",tag.tag_param);
    //  self.logger.Mmodbus_debug("Offset = ", offset)
    switch (dataType) {
    case 'double':
      return buffer.readDoubleBE(offset, true);
    case 'Floating Point':
      return buffer.readFloatBE(offset, true);
    case 'Integer2':
      return buffer.readUInt32BE(offset, true);
    case 'Integer1':
      return buffer.readInt32BE(offset, true);
    case 'Integer':
      return buffer.readUInt16BE(offset, true);
    case 'int8':
      return buffer.readInt16BE(offset, true);
    case 'bool':
      return buffer.readInt16BE(offset, true) === 0 ? 0 : 1;
    case 'string':
      return buffer.toString();
    default:
      return buffer.readUInt16BE(offset, true);
    }
  }
  updateValue(tagParam, value) {
    [tag, param, ...rest] = tagParam.split('_');
    if (this.isEmpty(tag) || this.isEmpty(param)) {
      return {error: `${tagParam} is a malformed tag. Should be of form tag_param`, success: false};
    }
    self.logger.Mmodbus_debug(`Tag : ${tag} Param: ${param} Rest: ${rest}`);
    let tagObj = Tags.findOne({tag: tag});
    if (tagObj === undefined) {
      return {error: `${tagParam} does not exist in database`, success: false};
    }
    paramObj = _.findWhere(tagObj.params, {name: param});
    if (paramObj === undefined) {
      return {error: `Tag ${tag} is valid, but param ${param} is not valid for this tag`, success: false};
    }
    if (!Utils.isNumeric(value)) {
      return {error: `Value: ${value} is not valid.  Must be a number`, success: false};
    }
    this.modbusWrite(tagParam, value, paramObj.table, paramObj.dataType, paramObj.address);
    self.logger.Mmodbus_debug(`tagObj.params: ${JSON.stringify(paramObj, null, 4)}`);

  }
  modbusWrite(tag_param,table,dataType,address){
    let self = this;
    //console.log(scanGroup);
    this.logger.Mmodbus_debug("Scanning Group # " +scanGroup.groupNum + ' of Data Type ' + scanGroup.dataType);

    let quantity = scanGroup.quantity;
    this.logger.Mmodbus_debug("Address " + address + ' and length ' + quantity);
    transaction = {};
    switch (scanGroup.dataType) {
      case "Bit":
        transaction = self.master.readCoils(address, quantity);
        break;
      case "Integer":
        transaction = self.master.readHoldingRegisters(address, quantity);
        break;
      case "Floating Point":
        transaction = self.master.readHoldingRegisters(address, quantity);
        break;
      default:
        self.logger.Mmodbus_warn("ScanGroup ID: " + scanGroup.groupNum + " has incorrect Data Type");
    }
    transaction.setMaxRetries(0);
    Utils.syncTransactionOn(transaction,'timeout', function() {
      this.logger.Mmodbus_info('[transaction#timeout] Scan Group #:', scanGroup.groupNum);
    });
    //TODO What should I really do on error here?
    Utils.syncTransactionOn(transaction,'error', function(err) {
      self.logger.Mmodbus_error(`[transaction#error] ${scanGroup.groupNum} of DataType ${scanGroup.dataType}` +  'Err Msg: ' + err.message);
      //stopAllScanning();
    });
    Utils.syncTransactionOn(transaction,'complete', function(err, response) {
      //if an error occurs, could be a timeout
      if (err) {
        self.logger.Mmodbus_warn(`Error Message on Complete w/ ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`)
        self.logger.Mmodbus_warn(err.message);

      } else
      if (response.isException()) {
        self.logger.Mmodbus_error(`Got an Exception Message. Scan Group #: ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`)
        self.logger.Mmodbus_error(response.toString());
        self.reportModbusError(scanGroup);
      } else {
        self.logger.Mmodbus_debug(`Succesfully completed scanning of Scan Group #: ${scanGroup.groupNum} of DataType ${scanGroup.dataType}`);
        //update LiveTags from the response and scanGroup
        self.handleRespone(response,scanGroup);
      }
    });


  }
  isEmpty(str){
    return (!str || 0 === str.length);
  }

}
