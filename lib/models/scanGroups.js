ScanGroups = new Meteor.Collection("mmodbus_scanGroups");



Schemas.ScanGroups = new SimpleSchema({
    groupNum: {
        type: Number,
        label: "Group #"
    },
    table: {
        type: String,
        label: "Table",
        allowedValues: [
            "Coil",
            "Integer",
            "Floating Point"
        ]
    },
    startAddress: {
        type: Number,
        label: "Start Address"
    },
    endAddress: {
        type: Number,
        label: "End Address"
    },
    tags: {
        type: Array,
        label: "Tags",
        optional: true,
    },
    "tags.$": {
        type: Object,
        optional: true
    },
    "tags.$.tagid": {
        type: String
    },
    "tags.$.tag_param": {
        type: String,
        label: "Tag.Parameter"
    },
    "tags.$.address": {
        type: Number,
        label: "Address"
    },
    active: {
        type: Boolean,
        label: "Active",
        defaultValue: true
    },
    errorCount: {
        type: Number,
        label: "Error Count",
        defaultValue: 0
    }

});

ScanGroups.attachSchema(Schemas.ScanGroups);
