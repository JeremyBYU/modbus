
//Required NPM Modules
let modbus = Npm.require('h5.modbus');
let serialPort = Npm.require('serialPort');
let net = Npm.require('net');



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
    //Add Colleciton Reference
    this.collections = {LiveTags: LiveTags,ScanGrups: ScanGroups,Tags: Tags};
    //console.log(this.options);
    //console.log(this.options.scanOptions);

    this.initialize();
  }
  /**

  */
  initialize(){
    self = this;
    let masterConfig = self.createMasterConfiguration();
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

    //Need to make a SYNCHRONOUS version of master.on (which is asynchronous)
    //Meteor provides this function Meteor.wrapAsync to help
    let asyncMasterOn = (event, cb) => {
        self.master.on(event, cb);
    };
    let syncMasterOn = Meteor.wrapAsync(asyncMasterOn);
    syncMasterOn('error', function(err) {
        self.logger.Mmodbus_error('[master#error] %s', err.message);
        //stopAllScanning();
    });
    syncMasterOn('disconnected', function() {
        self.logger.Mmodbus_warn('[master#disconnected]');
        //stopAllScanning();
        //TODO Stop all Timers!
    });

    //asyncMaster('connected',function(){console.log('test');});
    syncMasterOn('connected', function() {

        self.logger.Mmodbus_info('[master#connected]');
        self.logger.Mmodbus_info('Beggining Scanning of Coils');
        self.startAllScanning();
    });


  }
  startAllScanning(){



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


    //TODO  Read_HR.remove({});
    //configureModbusHoldingRegisterCollections();
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
     * The logic finds the tag with the lowest number address.  It then groups
     * all coils that are in range of the lower address and *lower address + option (default 25)*
     * It then adds this group of tags as a Scan Group and the leftover tags continue
     * to make more Scan Groups following the same logic
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
    for (i = 0; i < this.options.groupOptions.maxCoilGroups && cleanCoils.length > 0; i++) {
      var low_tag = _.min(cleanCoils, function(tag) {
        //console.log(cleanCoils.address);
        return tag.address;
      });

      var low_address = low_tag.address; //Get the lowest address of all the coils
      var next_range = low_address + this.options.groupOptions.coilReadLength; //create an upper range from the config parameter (default +25)
      //console.log('next Range' + next_range);

      //Group the coils within the range (true Group) and those without the range (false Group).
      //add the true Group to the ScanGroups table
      //remove the trueGroup from the cleanCoils list
      var group = _.groupBy(cleanCoils, (tag) => {
        //console.log(tag.address);
        return tag.address <= next_range;
      });
      trueGroup = group.true;
      cleanCoils = group.false || [];
      //console.log('Less Than ',trueGroup);
      //console.log('Not less than',cleanCoils);
      //create ScanGroups document containing the tags within the address range.
      ScanGroups.insert({
        groupNum: i,
        table: "Coil",
        startAddress: low_address,
        endAddress: next_range,
        tags: trueGroup,
        active: true,
        errorCount: 0
      });
    }
  }

  /**
   *
   *
   *
   *
   *
   *
   *
   *
  *
  */
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
  /**
   * Provides a wrapper function for the Asynchronous function "on" of modbus object
   *
   * @param {String} event
   *
   * @param {Function} cb
   *
   * @returns {Void} Simply executes the callback on the provided event
   */



}
