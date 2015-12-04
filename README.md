# Mmodbus - Meteor Modbus

## Summary
This package adds the ability to communicate to modbus slaves (technically servers).  [Modbus](https://en.wikipedia.org/wiki/Modbus) is a protocol used in the controls industry that allows for open communication between different devices (PLCS [Programmable Logic Controllers], HMI's [Human Machine Interfaces], DCS [Distributable Control Systems], etc.). This package relies on an npm module called [h5.modbus](https://github.com/morkai/h5.modbus) that handles all the modbus communication.

This package creates a special collection in the mongo database that holds 'Tags'. A tag describes where to read or write from a modbus slave. Simply fill the collection with tags and call ```new Mmodbus()``` to instatiate a modbus client that will handle reading and writing to your tags.

### Tag Collection
The main collection that you as a developer are concerned with is the 'mmodbus_tags' collection.  Here you describe your the tags and parameters.
A tag contains the following: tag, description, array of param objects. Param objects contain the following: name, table, address, dataType.

Its not too complicated, here is an example Tag object:
```
{
  tag: 'XV01',
  description: 'Downstream Discharge Valve',
  params: [{
    name: 'PV', // In the controls industry PV stands for Process Variable.  This can be anything.
    table: 'Coil', // The modbus table
    address: 1, // The address in the 'Coil' table
    dataType: "Bit" // Expecting a 0 or 1
    }
  ]  
}
//Another More Complicated Example
{
  tag: 'TC01',
  description: 'Temperature Controller for Heat Exchanger',
  params: [{
      name: 'PV', // Param for current Temperature of Heat Exchanger
      table: 'Holding Register', // The modbus table
      address: 1, // The address in the 'Holding Register' table
      dataType: "Floating Point" // Expecting a Floating Point number e.g 20.0
    }, {
      name: 'SP', // Param for Set Point for Temperature of Heat Exchanger
      table: 'Holding Register', // The modbus table
      address: 3, // The address in the 'Holding Register' table
      dataType: "Floating Point" // Expecting a Floating Point number e.g 20.0      
    },
    {
      name: 'OP', // Operating Parameter, usually means % open for valve controlling temperature
      table: 'Holding Register', // The modbus table
      address: 5, // The address in the 'Holding Register' table
      dataType: "Floating Point" // Expecting a Floating Point number e.g 20.0      
    }
  ]  
}
```
### Server Startup
In meteor **server** startup create the following code:
```meteorModbus = new Mmodbus(CONFIG_OPTIONS);```
Below are all the configuration parameters and defaults when calling new Mmodbus();
```
CONFIG_OPTIONS = {
  scanOptions: {
    supressTransationErrors = true, retryOnException = false, maxConcurrentRequests = 1, defaultUnit = 1, defaultMaxRetries = 1, defaultTimeout = 1000
  } = {},
  rtu: {
    serialPort = '/dev/ttyACM0', baudRate = 9600, type = 'serial'
  } = {},
  ip: {
    type = 'tcp', host = '127.0.0.1', port = 502, autoConnect = true, autoReconnect = true, minConnectTime = 2500, maxReconnectTime = 5000
  } = {},
  groupOptions: {
    coilReadLength = 25, holdingRegisterLength = 25, maxCoilGroups = 5, maxHoldingRegisterGroups = 10
  } = {},
  useIP = true,
  scanInterval = 5000
}
```
scanOptions,rtu, and ip are options you can learn about from [h5.modbus](https://github.com/morkai/h5.modbus)

useIP tells whether the modbus slave is a TPC/IP or a serial slave

scanInterval tell how often you want to scan the modbus slaves for reads (ms)

### Scanning
Upon instantiation from ```new Mmodbus``` the following occurs:
* the mmodbus_liveTags and mmodbus_scanGroups collection are emptied
* the mmodbus_tags collection is scanned and the liveTag collection is created.
* the mmodbus_tags collection is analyzed and scanGroups are created that minimize reads to the modbus slaves (i.e. instead of 10 reads giving 10 different responses, we have 1 read with 1 larger response)
* the mmodbus client then scans all the scan groups (according you the interval you specify) and updates the liveTags collections

### Collections

| Mongo Collection Name | Global Variable Access            | Data Persists between Startup?  | Purpose                                                             |
| :------------         |:----------------                  | -----:                          | : ----------------------------------------------------------------- |
| mmodbus_tags          | MmodusUtils.collections.Tags      | Yes                             | Contains all tags and configuration (think of this as an offline db)|
| mmobdus_liveTags      | MmodusUtils.collections.LiveTags  | No                              | Contains the live values of the tags from scanning (live db)        |
| mmobdus_scanGroups    | MmodusUtils.collections.ScanGroups| No                              | Groups continuous tag addresses into scan groups                    |
| mmobdus_mmodbus_log   | NA                                | Yes                             | Persistent log of errors                                            |
