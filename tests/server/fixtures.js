/**
 * Fixture class will create tags for testing
 *
 * @param
 * @returns
 */
TestFixture = class TestFixture {
  constructor() {
    this.test = 1;
  }
    /**
     * Generates Scan Tags, These tag objects are the simple tags that are placed
     * in the ScanGrops "tags" array.  They are not the Full tags that reside in a Tag Collection
     *
     * @param {Number} addressLow - The starting Address to begin creating tags
     * @param {Number} quantity - How many tags to make
     * @param {Number} registersPerTag - How many registers should each tag take up
     * @param {Number} continous - Should the tags be continous or randomly spread out?
     * @returns {Array} tagArray - An array of Tag Obejcts
     */
  generateScanTags(addressLow, quantity, dataType, continous = true) {
    registersPerTag = MmodbusUtils.funcs.getRegisterQuantityFromType(dataType);
    //  simple error check on quantities provided
    let tagArray = [];
    if (addressLow < 0 || quantity < 1 || quantity > 100000) {
      console.log('Address must be greater than -1; quanity must be greater than 0 and less than 10,000');
      return [];
    }
    for (let i = addressLow; i < quantity; i++) {
      let tagid = Math.random().toString(36).substr(2, 10);
      let tagParam = 'XV' + i;
      let address = continous ? i * registersPerTag : (i * registersPerTag + Math.floor(Math.random() * 5));
      tagArray.push(this.makeTagObject(tagid, tagParam, address));
    }
    return tagArray;
  }
  makeTagObject(tagid, tagParam, address) {
    return {
      tagid: tagid,
      tag_param: tagParam,
      address: address
    };
  }
  makeFullTagObject(tag, params) {
    return {
      tag: tag,
      params: params
    };
  }
  makeParmObject(name, table, address, dataType) {
    return {
      name: name,
      table: table,
      address: address,
      dataType: dataType
    };
  }
    /**
     * Generates FullTags, These are the Full tags that reside in a Tag Collection
     *
     * @param {Number} addressLow - The starting Address to begin creating tags
     * @param {Number} quantity - How many tags to make
     * @param {Number} registersPerTag - How many registers should each tag take up
     * @param {Number} continous - Should the tags be continous or randomly spread out?
     * @returns {Array} tagArray - An array of Tag Obejcts
     */
  generateFullTags(addressLow, quantity, table, dataType, continous = true, paramsPerTag = 1) {
    if (addressLow < 0 || quantity < 1 || quantity > 100000) {
      console.log('Address must be greater than -1; quanity must be greater than 0 and less than 100,000');
      return [];
    }
    let tagArray = [];
    let registerQuantity = MmodbusUtils.funcs.getRegisterQuantityFromType(dataType);
    let tagObject = null;
    let lastAddress = addressLow;
    for (let i = addressLow; i < quantity + addressLow; i++) {
      let tag = Math.random().toString(36).substr(2, 10);
      let param = "PV" + i;
      let address = continous ? i * registerQuantity : (lastAddress + registerQuantity + Math.floor(Math.random() * 5));
      lastAddress = address;

      if (tagObject === null || tagObject.params.length >= paramsPerTag) {
        //  Create a new tag object and param
        let params = [];
        params.push(this.makeParmObject(param, table, address, dataType));
        tagObject = this.makeFullTagObject(tag, params);
        tagArray.push(tagObject);
      } else {
        //  tag object exists and has room for another param!
        let paramObject = this.makeParmObject(param, table, address, dataType);
          //  console.log(tagObject);
        tagObject.params.push(paramObject);
      }
    }
    return tagArray;
  }
  reduceScanGroupsToOneTagArray(scanGroups) {
    let tagArrays = [];
    _.each(scanGroups, (group) => {
      tagArrays.push(group.tags);
    });
    let allTagsSingleArray = _.reduce(tagArrays, function(result, arr) {
      return result.concat(arr);
    }, []);
    return allTagsSingleArray;
  }
  getRandomTagParam(dataType) {
    let tags = MmodbusUtils.collections.Tags.findOne({
      "params.dataType": dataType
    }, {
      fields: {
        'tag': 1,
        'params': 1
      }
    });
    let tagParam = tags.tag + '_' + _.findWhere(tags.params, {dataType: dataType}).name;
    return tagParam;
  }
};
