// //Need to make a SYNCHRONOUS version of master.on (which is asynchronous)
// //Meteor provides this function Meteor.wrapAsync to help
let asyncMasterOn = (self,event, cb) => {
    self.master.on(event, cb);
};
let syncMasterOn = Meteor.wrapAsync(asyncMasterOn);
Utils = {
  syncMasterOn: syncMasterOn

};
