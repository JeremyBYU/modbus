/*
This file hold all information for tag configuration.  Alarming should be placed elseware.


*/

Tags = new Meteor.Collection("mmodbus_tags");

Tags.allow({
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

//This will define the Schema for a Modbus Tag
Schemas.Tag = new SimpleSchema({
    tag: {
        type: String,
        label: "Tag",
        regEx: /^[a-z0-9A-Z]{3,15}$/,
        max: 20,
        unique: true
    },
    description: {
        type: String,
        label: "Description",
        defaultValue: "",
        max: 40
    },
    params: {
        type: Array,
        label: "Parameter",
        optional: false,
        minCount: 1,
        maxCount: 5
    },
    "params.$": {
        type: Object,
        optional: false
    },
    "params.$.name": {
        type: String,
        regEx: /^[a-z0-9A-Z]{3,15}$/
    },
    "params.$.table": {
        type: String,
        label: "Address Table",
        allowedValues: [
            "Coil",
            "Holding Register"
        ]
    },
    "params.$.address": {
        type: Number,
        label: "Address",
        min: 0,
        max: 10000
    },
    "params.$.dataType": {
        type: String,
        label: "Data Type",
        optional: true,
        allowedValues: [
            "Bit",
            "Floating Point",
            "Integer"
        ],
        defaultValue: "Bit"
    },
    markDelete: {
        type: Boolean,
        label: 'Delete',
        defaultValue: false
    }
});

Tags.attachSchema(Schemas.Tag);
