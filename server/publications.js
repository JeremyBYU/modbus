Meteor.publish('mmodbus_tags', () => {
  return Tags.find({})
})
