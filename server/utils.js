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
let syncTransactionOn = Meteor.wrapAsync(AsyncTransactionOn);


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
};

let getRegisterQuantityFromType = (table) =>{
  switch (table)
  {
    case 'Floating Point':
    case 'Integer':
      return 2;
    default:
      return 1;
  }
};

/**
 * This funciton will assignScanGroups from the provided items list (list of tags)
 * It tries to maximize the size of the scan group (for modbus effeciency)
 * However it always honor the max readLength of the argument provided.
 * A scan group will alway be a specific data type (table), however there can
 * be multiple scan groups for each table
 * @param {array} items - List of Tag_Params to add to scan group
 * @param {Number} maxReadLength - The maximum range of a ScanGroup
 * @param {Number} table - Table name for the Scan Group
*/
let assignScanGroup = (items,maxReadLength,table) => {
  let scanGroups = new Array();
  let scanGroup;
  let lastAddress;

  //console.log(JSON.stringify(scanGroups));
  let lastTagIndex = items.length - 1;

  let adjustQuantity = (scanGroup, i) =>
  {
    if (i === lastTagIndex)
    {
      scanGroup.quantity += getRegisterQuantityFromType(table) - 1;
    }
  }
  let createNewScanGroup = (groupNum,table,startAddress) =>{
    return{
      groupNum: groupNum,
      table: table,
      startAddress: startAddress,
      quantity: 1,
      tags: new Array(),
      active: true,
      errorCount: 0
    }
  }
  items.sort((a, b) =>{
    return a.address - b.address;
  });

  items.forEach((tag, i) => {
    if (i === 0){
      scanGroup = createNewScanGroup(0,table,tag.address);
      lastAddress = tag.address;
      scanGroup.tags.push(tag);
      adjustQuantity(scanGroup, i);
      scanGroups.push(scanGroup);
      return;
    }
    let diff = tag.address - lastAddress;
    if (scanGroup.quantity + diff > maxReadLength){
      scanGroup.quantity += getRegisterQuantityFromType(table) - 1;

      scanGroup = createNewScanGroup(scanGroups.length,table,tag.address);
      lastAddress = tag.address;
      scanGroup.tags.push(tag);
      adjustQuantity(scanGroup, i);
      scanGroups.push(scanGroup);
      //console.log(JSON.stringify(scanGroups));
      return;
    }
    scanGroup.quantity += diff;
    adjustQuantity(scanGroup, i);
    scanGroup.tags.push(tag);
    lastAddress = tag.address;
    //console.log(JSON.stringify(scanGroups));
  });
  //console.log(JSON.stringify(scanGroups));
  return scanGroups;

};
let createScanGroups = (scanGroups) =>{
  _.each(scanGroups, (scanGroup) =>{
    ScanGroups.insert(scanGroup);
  });
}
Utils = {
  syncMasterOn: syncMasterOn,
  assignScanGroup: assignScanGroup,
  createScanGroups: createScanGroups,
  createMasterConfiguration: createMasterConfiguration,
  syncTransactionOn: syncTransactionOn

};
Mmodbus_Utils.Utils = Utils;
