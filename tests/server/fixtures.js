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
   generateScanTags(addressLow,quantity,registersPerTag =1,continous = true){
     //simple error check on quantities provided
     let tagArray = new Array();
     if(addressLow < 0 || quantity < 1 || quantity > 10000 ){
       console.log('Address must be greater than -1; quanity must be greater than 0 and less than 10,000');
       return;
     }
     for(let i = addressLow;i < quantity;i++){
       let tagid = Math.random().toString(36).substr(2, 10);
       let tag_param = 'XV' + i;
       let address = continous ? i*registersPerTag :(i*registersPerTag + Math.floor(Math.random() * 5 ));
       tagArray.push(this.makeTagObject(tagid,tag_param,address));
     }
     return tagArray;

   }
   makeTagObject(tagid,tag_param,address){
     return {tagid: tagid,tag_param: tag_param,address: address}
   }
 }
