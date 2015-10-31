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
  beforeEach(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = tagQuantity,
    this.registerLength = 2,
    this.maxReadLength = 4;
    this.table = "Integer";
    this.continous = false;

    this.scanTags = fixtures.generateScanTags(this.startAddress,this.quantity,this.registerLength,this.continous);
    this.scanGroups = Mmodbus_Utils.Utils.assignScanGroup(this.scanTags,this.maxReadLength,this.table);
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
  beforeEach(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = tagQuantity,
    this.registerLength = 2,
    this.maxReadLength = 4;
    this.table = "Integer";
    this.continous = false;

    this.scanTags = fixtures.generateScanTags(this.startAddress,this.quantity,this.registerLength,this.continous);
    this.scanGroups = Mmodbus_Utils.Utils.assignScanGroup(this.scanTags,this.maxReadLength,this.table);
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
