const fs = require('fs');
const path = require('path');

// Load constants from constants.json
const constants = JSON.parse(fs.readFileSync(path.join(__dirname, 'constants.json'), 'utf8'));

// Export the constants loaded from the JSON file
const { GeneralManagerRoleID, freeAgentRoleID, HeadCoachRoleID, teams } = constants;

module.exports = { GeneralManagerRoleID, freeAgentRoleID, HeadCoachRoleID, teams };
