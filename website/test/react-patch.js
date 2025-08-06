// React.act global patch for testing compatibility
// This runs before any React imports and patches the global React modules

const Module = require('module');
const originalRequire = Module.prototype.require;

// Create a robust act function that handles all scenarios
const createAct = () => {
  return function act(callback) {
    try {
      const result = callback();
      
      // Handle Promise results
      if (result && typeof result === 'object' && typeof result.then === 'function') {
        return result.then(() => undefined);
      }
      
      // Handle sync results
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };
};

// Monkey patch the require function to intercept React imports
Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  // If this is React module and it doesn't have act, add it
  if (id === 'react' && module && !module.act) {
    module.act = createAct();
  }
  
  return module;
};

