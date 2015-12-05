# Mmodbus - Meteor Modbus

## Summary
This package adds the ability to communicate to modbus slaves (technically servers).  [Modbus](https://en.wikipedia.org/wiki/Modbus) is a protocol used in the controls industry that allows for open communication between different devices (PLCS [Programmable Logic Controllers], HMI's [Human Machine Interfaces], DCS [Distributable Control Systems], etc.). This package relies on an npm module called [h5.modbus](https://github.com/morkai/h5.modbus) that handles all the modbus communication.

This package creates a special collection in the mongo database that holds 'Tags'. A tag describes where to read or write from a modbus slave. Simply fill the collection with tags and call ```new Mmodbus()``` to instantiate a modbus client that will handle reading and writing to your tags.

A sample project using this package can be found [here](#).  There is no view layer included with this package, allowing you to create whatever views you want with whatever technology (blaze, angular, react).  However I have created my own react view layer that you can also used called [Mmodbus-reactview](#)

### Tag Collection
The main collection that you as a developer are concerned with is the 'mmodbus_tags' collection.  Here you describe the tags and parameters.
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
### Starting Mmodbus
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

### LiveTags Collection
mmobdus_liveTags is a collection that is generated anew on startup by analyzing the Tag collection and creating ```tag_param```'s. It consists of documents that are a combination of the ```tag``` name and the ```param``` name.  For example the first example above with ```XV01``` and param ```PV``` would be a tag param of ```XV01_PV```. This document would be updated regularly by the modbus client by querying the appropriate address and updating this document with the result. **This is the collection you should query to find updated values for the tags you have created**. This is like the online or live database, while Tags is like the offline database (theres a reason I did this to implement cool features later).

A side note...I learned the idea of ```tag_param``` structure from the controls industry.  It basically allows you to group things that are common together under a tag, and then differentiate them by the param.  Usually we use ```tagparam```, however mongo does not like the ```'.'``` so I used a ```'_'```.  This also means that you can not use a '_' when defining tags or params.

### Scan Groups Collection
In modbus you want to minimize as much requests and communication as possible.  Its not exactly a compressed protocol and its speed isn't too great (especially for serial connections).  In order to do this you sometimes want to group requests together.

For example lets say tag_param ```TC01_PV``` is at address 1 and ```TC01_SP``` is at address 3.  Instead of creating to separate requests to read these adjacent registers, would it not be better to create 1 request that reads **both** registers.  We could do this by creating a scanGroup and adding both these tags to it.  The scan group would have a starting address of 1 and would ```scan``` a quantity of 3.  After reading it it would then update the appropriate tags.

This is the purpose of mmodbus_scanGroups collection.  This collection is created on startup and has an algorithm to appropriately group tags together and form scanGroups. You can configure how big these groups can get with the configuration options ```coilReadLength``` and ```holdingRegisterLength```

### Server Startup Sequence
Upon instantiation from ```new Mmodbus``` the following occurs:
* the mmodbus_liveTags and mmodbus_scanGroups collections are emptied
* the mmodbus_tags collection is scanned and the liveTag collection is created.
* the mmodbus_tags collection is analyzed and scanGroups are created that minimize reads to the modbus slaves (i.e. instead of 10 reads giving 10 different responses, we have 1 read with 1 larger response)
* the mmodbus client then scans all the scan groups (according you the interval you specify) and updates the liveTags

### Collections

| Mongo Collection Name | Global Variable Access            | Data Persists between Startup?  | Purpose                                                             |
| ------------         |----------------                  | -----                          |  ----------------------------------------------------------------- |
| mmodbus_tags          | MmodusUtils.collections.Tags      | Yes                             | Contains all tags and configuration (think of this as an offline db)|
| mmobdus_liveTags      | MmodusUtils.collections.LiveTags  | No                              | Contains the live values of the tags from scanning (live db)        |
| mmobdus_scanGroups    | MmodusUtils.collections.ScanGroups| No                              | Groups continuous tag addresses into scan groups                    |
| mmobdus_mmodbus_log   | NA                                | Yes                             | Persistent log of errors                                            |

### Global Variables
MModbus is the global **class** variable you use to instantiate a new Mmodbus client. It has several function you may find useful.  I need to later release an API for it, for now just check out the source code and comments.

MMobdusUtils is another global variable that contains the following data
```
MModbusUtils.collections // All the collections for the Mmodbus package
MMobusUtils.funcs //  Helper Functions
```
