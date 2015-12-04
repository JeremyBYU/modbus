
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
    //  this.mmodbus = new Mmodbus({});
    //  simple tag objects, used to create scan groups
    this.startAddress = 0;
    this.quantity = tagQuantity;
    this.maxReadLength = 4;
    this.dataType = "Integer";
    this.continuous = false;

    this.scanTags = fixtures.generateScanTags(this.startAddress, this.quantity, this.dataType, this.continuous);
    this.scanGroups = MmodbusUtils.funcs.assignScanGroup(this.scanTags, this.maxReadLength, this.dataType);
    //  console.log(this.scanGroups);
  });
  it('Can assign scan groups', () => {
    expect(this.scanGroups).toEqual(jasmine.any(Object));
  });
  it('Every Scan Group is within their read limit', () => {
    _.every(this.scanGroups, (group) => {
      group.quantity <= this.maxReadLength;
    });
  });
  it('Every ScanGroup has tags', () =>{
    let allHaveTags = _.every(this.scanGroups, (group) =>{
      return group.tags.length > 0;
    });
    expect(allHaveTags).toBe(true);
  });
  it('Every Tag is found in a Scan Group', () =>{
    let allTagsSingleArray = fixtures.reduceScanGroupsToOneTagArray(this.scanGroups);
    //  this.scanTags.push(fixtures.makeTagObject('blah','blah', 1));
    let allTagsFound = _.every(this.scanTags, (tag) =>{
      return _.contains(allTagsSingleArray, tag);
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
    //  Ensure Tag Collection is empty
    MmodbusUtils.collections.Tags.remove({});

    this.startAddress = 0;
    this.quantity = tagQuantity;
    this.maxReadLength = 4;
    this.continuous = false;
    this.paramsPerTag = 3;

    let integerTags = fixtures.generateFullTags(this.startAddress, this.quantity, "Holding Register", "Integer", this.continuous, this.paramsPerTag);
    let floatingPointTags = fixtures.generateFullTags(this.quantity * 5, this.quantity, "Holding Register", "Floating Point", this.continuous, this.paramsPerTag);
    let coilTags = fixtures.generateFullTags(this.startAddress, this.quantity, "Coil", "Bit", this.continuous, this.paramsPerTag);

    this.fullTags = integerTags.concat(floatingPointTags).concat(coilTags);

    _.each(fullTags, (tag) => {
      MmodbusUtils.collections.Tags.insert(tag);
    });
  });
  it('Fixture generated correct tags and was able to store in Mmodbus Tag Collection (Schema Enforced)', () => {
    let mongoTagCollection = MmodbusUtils.collections.Tags.find({}).fetch();
    expect(mongoTagCollection.length).toBe(this.fullTags.length);
  });
  it('Can create Mmodbus Object by using NEW operator', () =>{
    this.mmodbus = new Mmodbus({});
    expect(this.mmodbus).toEqual(jasmine.any(Object));
  });
  it('Verify Scan Group Collection exists and has data', () =>{
    let mongoScanGroupCollection = MmodbusUtils.collections.ScanGroups.find({}).fetch();
    expect(mongoScanGroupCollection.length).toBeGreaterThan(0);
  });
  it('Verify Live Tags Collection exists and has data', () =>{
    let mongoLiveTagsCollection = MmodbusUtils.collections.LiveTags.find({}).fetch();

    expect(mongoLiveTagsCollection.length).toBeGreaterThan(0);
  });
  afterAll(()=> {
    if (this.mmodbus) {
      this.mmodbus.destroy();
    }
  });
});
describe('Test Mmodbus Class, Modbus Simulator Needed', () => {
  beforeAll((done)=> {
    //  Ensure Tag Collection is empty
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    MmodbusUtils.collections.Tags.remove({});

    this.startAddress = 0;
    this.quantity = tagQuantity;
    this.maxReadLength = 4;
    this.continuous = false;
    this.paramsPerTag = 3;

    let integerTags = fixtures.generateFullTags(this.startAddress, this.quantity, "Holding Register", "Integer", this.continuous, this.paramsPerTag);
    let floatingPointTags = fixtures.generateFullTags(this.quantity * 5, this.quantity, "Holding Register", "Floating Point", this.continuous, this.paramsPerTag);
    let coilTags = fixtures.generateFullTags(this.startAddress, this.quantity, "Coil", "Bit", this.continuous, this.paramsPerTag);

    this.fullTags = integerTags.concat(floatingPointTags).concat(coilTags);
    //  console.log(JSON.stringify(this.fullTags,null,4));
    _.each(this.fullTags, (tag) => {
      MmodbusUtils.collections.Tags.insert(tag);
    });

    this.startingTime = new Date();
    this.mmodbus = new Mmodbus({});

    Meteor.setTimeout(function() {
      done();
    }, 8000);
  }, 10000);
  it('Can Connect to Modbus Master', () => {
    let masterIsConnected = this.mmodbus.master.getConnection().isOpen();
    expect(masterIsConnected).toBe(true);
  });
  it('Live Tags are updating', () => {
    //  console.log(this.startingTime);
    let updatedTime = new Date(this.startingTime.getTime() + 4000);
    let mongoUpdatedLiveTagsCollection = MmodbusUtils.collections.LiveTags.find({modifiedAt: {$gte: updatedTime}}).fetch();
    // console.log(`Starting Time: ${this.startingTime}`);
    // console.log(`Updated Time: ${updatedTime}`);
    // console.log(JSON.stringify(mongoLiveTagsCollection,null,2));
    expect(mongoUpdatedLiveTagsCollection.length).toBe(this.quantity * 3);
  });
  it('Write to Single Holding Register', (done) => {
    //  console.log(this.startingTime);
    let valueToWrite = 100;
    let tagParam = fixtures.getRandomTagParam('Integer');
    this.mmodbus.updateValue(tagParam, valueToWrite);
    Meteor.setTimeout(function() {
      let updatedTag = MmodbusUtils.collections.LiveTags.findOne({tag_param: tagParam});
      expect(updatedTag.value).toBe(valueToWrite);
      done();
    }, 6000);
  });
  it('Write to Single Coil', (done) => {
    let valueToWrite = 1;
    let tagParam = fixtures.getRandomTagParam('Bit');
    this.mmodbus.updateValue(tagParam, valueToWrite);
    Meteor.setTimeout(function() {
      let updatedTag = MmodbusUtils.collections.LiveTags.findOne({tag_param: tagParam});
      expect(updatedTag.value).toBe(valueToWrite);
      done();
    }, 6000);
  });
});
