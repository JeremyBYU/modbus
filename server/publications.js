Meteor.publish('mmodbus_tags', () => {
  return Tags.find({})
})
Meteor.publish('mmodbus_liveTags', () => {
  return LiveTags.find({})
})
