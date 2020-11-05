const finalPuzzles = require('../config').final_puzzles

module.exports = {
    0: ["HQ", "Organizers", finalPuzzles[0], false],
    1: ["MS", "Middle School", finalPuzzles[1], true],
    2: ["HS", "High School", finalPuzzles[2], true],
    3: ["OP", "Open/Public", finalPuzzles[3], false]
}

// format: ["Abbr.", "Full Name", "recFinal", Boolean - Ranked]