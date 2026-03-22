const fs = require('fs').promises;
const path = require('path');

/**
 * Safely read JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Array>} Parsed JSON data or empty array if file doesn't exist
 */
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    console.error(`Error reading JSON from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Safely write JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @param {Array|Object} data - Data to write
 * @returns {Promise<void>}
 */
async function writeJSON(filePath, data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write with formatting for readability
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing JSON to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get data file path in the data directory
 * @param {string} filename - Filename (e.g., 'products.json')
 * @returns {string} Full path to file
 */
function getDataPath(filename) {
  return path.join(__dirname, '..', 'data', filename);
}

module.exports = {
  readJSON,
  writeJSON,
  getDataPath,
};
