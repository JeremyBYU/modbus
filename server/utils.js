/**
* A utility Object that Mmodus class can use
* created this to keep Mmodbus class more lean
*
*/
//Required NPM Modules
let serialPort = Npm.require('serialPort');
let net = Npm.require('net');


// //Need to make a SYNCHRONOUS version of master.on (which is asynchronous)
// //Meteor provides this function Meteor.wrapAsync to help
/**
 * Provides a wrapper function for the Asynchronous function "on" of modbus object
 *
 * @param {Object} self
 *
 * @param {String} event
 *
 * @param {Function} cb
 *
 * @returns {Void} Simply executes the callback on the provided event
 */
let asyncMasterOn = (self,event, cb) => {
    self.master.on(event, cb);
};
let syncMasterOn = Meteor.wrapAsync(asyncMasterOn);

let AsyncTransactionOn = (transaction, event, cb) => {
    transaction.on(event, cb)
};
let SyncTransactionOn = Meteor.wrapAsync(AsyncTransactionOn);


let createMasterConfiguration = (self) => {
  //console.log(self);
  let transport = {}; //transport object for modbus connections
  //Will be creating a TCP IP Connection for transport object
  if(self.options.useIP){
    let socket = new net.Socket();
    transport.type = 'ip';
    transport.eofTimeout = 10;
    transport.connection = _.extend({},self.options.ip,{socket: socket});
    //console.log(transport);

  }//Will be creating a serial connection for transport object.
  else {
    let serialPort = new SerialPort(self.options.rtu.serialPort, {
      baudRate: self.options.rtu.baudRate
    });
    transport.type = 'rtu',
    transport.eofTimeout = 10;
    transport.connection = { type: self.options.rtu.type, serialPort: serialPort}
  }
  let masterConfig = _.extend({},self.options.scanOptions,{transport:transport});
  return masterConfig;
}

/**
 * The logic finds the tag with the lowest number address.  It then groups
 * all items that are in range of the lower address and *lower address + option (default 25)*
 * It then adds this group of items as a Scan Group and the leftover items continue
 * to make more Scan Groups following the same logic
 * @param {array} items - List of Tag_Params to add to scan group
 * @param {Number} maxGroups - The maximum number of scanGroups you will allow to be created
 * @param {Number} maxReadLength - The maximum range of a ScanGroup
 * @param {Number} table - Table name for the Scan Group
*/
let createScanGroup = (items,maxGroups,maxReadLength,table) => {
  for (i = 0; i < maxGroups && items.length > 0; i++) {
    let low_tag = _.min(items, (tag) => {
      //console.log(tag.address);
      return tag.address;
    });

    let low_address = low_tag.address; //Get the lowest address of all the coils
    let next_range = low_address + maxReadLength; //create an upper range from the config parameter (default +25)
    //console.log('next Range' + next_range);

    //Group the coils within the range (true Group) and those without the range (false Group).
    //add the true Group to the ScanGroups table
    //remove the trueGroup from the items list
    let group = _.groupBy(items, (tag) => {
      //console.log(tag.address);
      return tag.address <= next_range;
    });
    trueGroup = group.true;
    items = group.false || [];
    //console.log('Less Than ',trueGroup);
    //console.log('Not less than',items);
    //create ScanGroups document containing the tags within the address range.
    ScanGroups.insert({
      groupNum: i,
      table: table,
      startAddress: low_address,
      endAddress: next_range,
      tags: trueGroup,
      active: true,
      errorCount: 0
    });
  }
};
Utils = {
  syncMasterOn: syncMasterOn,
  createScanGroup: createScanGroup,
  createMasterConfiguration: createMasterConfiguration,
  SyncTransactionOn: SyncTransactionOn

};
