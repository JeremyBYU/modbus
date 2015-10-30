// Write your tests here!
// Here is an example.

let fixtures = new TestFixture();



//console.log(scanTags);
// Tinytest.add('example', function (test) {
//   test.equal(true, true);
// });
describe('Test Utility Functions, assume continous tags', () => {
  beforeEach(()=> {
    //this.mmodbus = new Mmodbus({});
    //simple tag objects, used to create scan groups
    this.startAddress = 0,
    this.quantity = 5,
    this.registerLength = 2,
    this.maxReadLength = 4;
    this.table = "Integer";
    this.continous = true;

    this.scanTags = fixtures.generateScanTags(this.startAddress,this.quantity,this.registerLength,this.continous);
    this.scanGroups = Mmodbus_Utils.Utils.assignScanGroup(this.scanTags,this.maxReadLength,this.table);
  });
  it('Can assign scan groups', () => {
    expect(this.scanGroups).toEqual(jasmine.any(Object));
  });
  it('Assigned correct number of scan groups',() => {
    let numScanGroups = (this.quantity % this.registerLength === 0) ? this.quantity/this.registerLength : Math.floor(this.quantity/this.registerLength) + 1;
    expect(this.scanGroups.length).toEqual(numScanGroups);
  });
  it('Every ScanGroup has tags',() =>{
    let allHaveTags = _.every(this.scanGroups,(group) =>{
      return group.tags.length > 0
    });
    expect(allHaveTags).toBe(true);
  });
  it('Every Tag is found in a scanGroup',() =>{
    let allTagsFound = _.every(this.scanTags,(tag) =>{
      let foundTag = false;
      _.every(this.scanGroups,(group) =>{
        let foundTagInner = _.some(group.tags,(otherTag) =>{
          console.log(`Comparing ${tag.tagid} with ${otherTag.tagid}`);
          return tag.tagid == otherTag.tagid;
        });
        if(foundTagInner == true){
          foundTag = true;
          return false;
        }else{
          return true;
        }
      });
      return foundTag;
    });
    expect(allTagsFound).toBe(true);
  });
});
