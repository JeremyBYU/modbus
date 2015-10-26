if(Meteor.isClient){
  Template.registerHelper("Mmodbus", Mmodbus.getCollections());
}
