Schemas = {};

LiveTags = new Meteor.Collection("mmodbus_liveTags");

Schemas.LiveTags = new SimpleSchema({
  tagid: {
    type: String,
    label: 'Tag _id',
  },
  tag_param: {
    type: String,
    label: "Tag_Param",
    max: 20
  },
  description: {
    type: String,
    label: "Description",
    defaultValue: "",
    max: 40
  },
  dataType: {
    type: String,
    label: "Data Type",
    optional: false,
    allowedValues: [
      "Bit",
      "Floating Point",
      "Integer"
    ],
    defaultValue: "Bit"
  },
  value: {
    type: Number,
    decimal: true,
    label: 'Live Value',
    optional: false,
    defaultValue: 0
  },
  modifiedAt: {
    type: Date,
    label: 'Date of Modification',
    optional: false
  },
  quality: {
    type: Boolean,
    label: "Quality",
    optional: true,
    defaultValue: true
  }
});

LiveTags.attachSchema(Schemas.LiveTags);
