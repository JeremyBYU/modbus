// Write your tests here!
// Here is an example.

let fixtures = new TestFixture();
let tagQuantity = 10;


/**
 * This will test the Utility Funcitons that MModbus Class uses
 * The Utility Functions take a list of tags and create appropriate Scan Groups
 * @param
 * @returns
 */
describe('Test Utility Functions, NonContinous tags', () => {
  beforeAll(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = tagQuantity,
    this.maxReadLength = 4;
    this.dataType = "Integer";
    this.continuous = false;

    this.scanTags = fixtures.generateScanTags(this.startAddress,this.quantity,this.dataType,this.continuous);
    this.scanGroups = Mmodbus_Utils.Utils.assignScanGroup(this.scanTags,this.maxReadLength,this.dataType);
    //console.log(this.scanGroups);
  });
  it('Can assign scan groups', () => {
    expect(this.scanGroups).toEqual(jasmine.any(Object));
  });
  it('Every Scan Group is within their read limit',() => {
    _.every(this.scanGroups,(group) => {
      group.quantity <= this.maxReadLength;
    });
  });
  it('Every ScanGroup has tags',() =>{
    let allHaveTags = _.every(this.scanGroups,(group) =>{
      return group.tags.length > 0
    });
    expect(allHaveTags).toBe(true);
  });
  it('Every Tag is found in a scanGroup',() =>{
    let allTagsSingleArray = fixtures.reduceScanGroupsToOneTagArray(this.scanGroups);
    //this.scanTags.push(fixtures.makeTagObject('blah','blah', 1));
    let allTagsFound = _.every(this.scanTags, (tag) =>{
      return _.contains(allTagsSingleArray,tag);
    });
    expect(allTagsFound).toBe(true);
  });
});
/**
 * This will test the Mmodbus Class will correctly create collection records
 *
 * @param
 * @returns {Void}
 */
describe('Test Mmodbus Class, No Modbus Simulator Needed', () => {
  beforeAll(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = tagQuantity,
    this.maxReadLength = 4;
    this.table = "Holding Register";
    this.dataType = "Integer";
    this.continous = false;
    this.paramsPerTag = 3;

    this.fullTags = fixtures.generateFullTags(this.startAddress,this.quantity,this.table, this.dataType,this.continous,this.paramsPerTag);


    //console.log(JSON.stringify(this.fullTags,null,4));
  });
  it('Can assign scan groups', () => {
    expect(this.scanGroups).toEqual(jasmine.any(Object));
  });

});
