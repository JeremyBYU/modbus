if(Meteor.isClient){
  Template.registerHelper("Mmodbus", MmodbusUtils.collections);
}
