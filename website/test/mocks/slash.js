// Mock for slash module to avoid ESM issues in Jest
module.exports = function slash(path) {
  return path.replace(/\\/g, '/')
}
module.exports.default = module.exports
