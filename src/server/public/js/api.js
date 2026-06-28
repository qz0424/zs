const API = {
  base: '',

  get token() {
    const t = localStorage.getItem('token');
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return null;
      }
    } catch(e) {
      localStorage.removeItem('token');
      return null;
    }
    return t;
  },

  async request(method, path, body) {
    const opts = { method, headers: {} };
    if (this.token) opts.headers['Authorization'] = 'Bearer ' + this.token;
    if (body && !(body instanceof FormData)) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body) {
      opts.body = body;
    }
    const res = await fetch(this.base + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }));
      throw new Error(err.error || '请求失败');
    }
    return res.json();
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },

  login(username, password) {
    return this.post('/api/auth/login', { username, password });
  },

  register(username, password) {
    return this.post('/api/auth/register', { username, password });
  },

  getCurtains(params) {
    const q = new URLSearchParams(params || {}).toString();
    return this.get('/api/curtains' + (q ? '?' + q : ''));
  },

  getCurtain(id) { return this.get('/api/curtains/' + id); },

  saveCurtain(data, id) {
    return id ? this.put('/api/curtains/' + id, data) : this.post('/api/curtains', data);
  },

  deleteCurtain(id) { return this.del('/api/curtains/' + id); },

  setStatus(id, status) { return this.put('/api/curtains/' + id + '/status', { status }); },

  getCategories() { return this.get('/api/categories'); },

  saveCategory(data, id) {
    return id ? this.put('/api/categories/' + id, data) : this.post('/api/categories', data);
  },

  deleteCategory(id) { return this.del('/api/categories/' + id); },

  getFavorites(params) {
    const q = new URLSearchParams(params || {}).toString();
    return this.get('/api/favorites' + (q ? '?' + q : ''));
  },

  toggleFavorite(curtainId, add, collectionId) {
    if (add) {
      return this.post('/api/favorites', { curtain_id: curtainId, collection_id: collectionId || null });
    }
    const q = collectionId ? '?collection_id=' + collectionId : '';
    return this.del('/api/favorites/' + curtainId + q);
  },

  moveFavorite(favId, collectionId) {
    return this.put('/api/favorites/' + favId + '/move', { collection_id: collectionId || null });
  },

  getCollections() { return this.get('/api/collections'); },

  createCollection(name) { return this.post('/api/collections', { name }); },

  renameCollection(id, name) { return this.put('/api/collections/' + id, { name }); },

  deleteCollection(id) { return this.del('/api/collections/' + id); },

  uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.post('/api/admin/upload', fd);
  },

  importBatch(items) { return this.post('/api/admin/import', { items }); },

  submitOrder(data) { return this.post('/api/orders', data); },

  lookupOrders(phone) {
    return this.get('/api/orders/lookup?phone=' + encodeURIComponent(phone));
  },

  getOrders(params) {
    const q = new URLSearchParams(params || {}).toString();
    return this.get('/api/orders' + (q ? '?' + q : ''));
  },

  getOrder(id) { return this.get('/api/orders/' + id); },

  setOrderStatus(id, status) { return this.put('/api/orders/' + id + '/status', { status }); },

  getSettings() { return this.get('/api/settings'); },

  saveSettings(data) { return this.put('/api/settings', data); },

  getPriceTiers() { return this.get('/api/pricetiers'); },

  getEnabledTiers() { return this.get('/api/pricetiers/enabled'); },

  savePriceTier(data, id) {
    return id ? this.put('/api/pricetiers/' + id, data) : this.post('/api/pricetiers', data);
  },

  deletePriceTier(id) { return this.del('/api/pricetiers/' + id); },

  togglePriceTier(id) { return this.put('/api/pricetiers/' + id + '/toggle'); },

  batchAssignTier(curtainIds, tierId) {
    return this.put('/api/pricetiers/batch/tier', { curtain_ids: curtainIds, tier_id: tierId });
  }
};
