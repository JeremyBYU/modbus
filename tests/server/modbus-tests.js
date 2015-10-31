// Write your tests here!
// Here is an example.

let fixtures = new TestFixture();
let tagQuantity = 10;


//console.log(scanTags);
// Tinytest.add('example', function (test) {
//   test.equal(true, true);
// });
xdescribe('Test Utility Functions, assume continous tags', () => {
  beforeEach(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = tagQuantity,
    this.registerLength = 2,
    this.maxReadLength = 4;
    this.table = "Integer";
    this.continous = true;

    this.scanTags = fixtures.generateScanTags(this.startAddress,this.quantity,this.registerLength,this.continous);
    this.scanGroups = Mmodbus_Utils.Utils.assignScanGroup(this.scanTags,this.maxReadLength,this.table);
  });
  it('Can assign Scan Groups', () => {
    expect(this.scanGroups).toEqual(jasmine.any(Object));
  });
  it('Assigned correct number of Scan Groups',() => {
    let numScanGroups = (this.quantity % this.registerLength === 0) ? this.quantity/this.registerLength : Math.floor(this.quantity/this.registerLength) + 1;
    expect(this.scanGroups.length).toEqual(numScanGroups);
  });
  it('Every Scan Group has tags',() =>{
    let allHaveTags = _.every(this.scanGroups,(group) =>{
      return group.tags.length > 0
    });
    expect(allHaveTags).toBe(true);
  });
  it('Every Tag is found in a Scan Group',() =>{
    let allTagsSingleArray = fixtures.reduceScanGroupsToOneTagArray(this.scanGroups);
    //this.scanTags.push(fixtures.makeTagObject('blah','blah', 1));
    let allTagsFound = _.every(this.scanTags, (tag) =>{
      return _.contains(allTagsSingleArray,tag);
    });
    expect(allTagsFound).toBe(true);
  });
});
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
