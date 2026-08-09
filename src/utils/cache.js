// src/utils/cache.js

window.Utils.Cache = {
    store: {},

    set: function(key, data) {
        this.store[key] = data;
    },

    get: function(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    },

    has: function(key) {
        return this.store[key] !== undefined;
    },

    getSearchKey: function(type, query, page, limit) {
        return 'search:' + type + ':' + query + ':' + (page || 1) + ':' + (limit || 20);
    },

    getDetailKey: function(type, token) {
        return 'detail:' + type + ':' + token;
    }
};
