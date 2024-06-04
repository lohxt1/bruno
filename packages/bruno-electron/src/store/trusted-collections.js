const _ = require('lodash');
const Store = require('electron-store');
const { exists } = require('../utils/filesystem');

class TrustedCollections {
  constructor() {
    this.store = new Store({
      name: 'preferences',
      clearInvalidConfig: true
    });
  }

  getAll() {
    return this.store.get('trustedCollections') || [];
  }

  add(collectionPath) {
    const collections = this.store.get('trustedCollections') || [];
    if (exists(collectionPath)) {
      if (!collections.includes(collectionPath)) {
        collections.push(collectionPath);
        this.store.set('trustedCollections', collections);
      }
    }
  }

  exists(collectionPath) {
    const collections = this.store.get('trustedCollections') || [];
    return collections.includes(collectionPath);
  }
}

module.exports = TrustedCollections;
