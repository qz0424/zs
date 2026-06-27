const API = {
  base: '',
  token: localStorage.getItem('token'),

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

  getFavorites() { return this.get('/api/favorites'); },

  toggleFavorite(curtainId, add) {
    return add ? this.post('/api/favorites', { curtain_id: curtainId }) : this.del('/api/favorites/' + curtainId);
  },

  uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.post('/api/admin/upload', fd);
  },

  importBatch(items) { return this.post('/api/admin/import', { items }); }
};
