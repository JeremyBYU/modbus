Schemas = {};

LiveTags = new Meteor.Collection("mmodbus_liveTags");


LiveTags.allow({
    insert: function(userId, doc) {
        //return can.createItem(userId);
        return true;
    },
    update: function(userId, doc, fieldNames, modifier) {

        return true;
        //return can.editItem(userId, doc);
    },
    remove: function(userId, doc) {
        return true;
        //return can.removeItem(userId, doc);
    }
});



Schemas.LiveTags = new SimpleSchema({
    tagid:{
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
    value: {
    	type: Number,
    	label: 'Live Value',
    	optional: false,
    	defaultValue: 0
    },
    modifiedAt:{
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
