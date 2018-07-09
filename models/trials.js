const mongoose = require('mongoose');

let dataSchema = new mongoose.Schema({
    subject: String,
    left_label_div: String,
    right_label_div: String,
    target_item: String,
    rt: Number,
    response: String,
    correct: Boolean,
    mouse_movement: {type: Array, "default": []}
});

const trial = mongoose.model('trialData', dataSchema);
module.exports = trial;