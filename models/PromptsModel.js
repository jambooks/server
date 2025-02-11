const BaseModel = require('./BaseModel');

class PromptModel extends BaseModel {
    constructor (options) {
        super(options, 'prompts');
    }
}

module.exports = PromptModel;
