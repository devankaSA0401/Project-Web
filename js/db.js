/**
 * TOKO NADYN POS – Database Layer (Remote REST API)
 * All data is now fetched from the Node.js SQL Server Backend.
 */

const DB = {
  apiBase: 'http://localhost:3000/api',

  async getAll(col) {
    try {
      const res = await fetch(`${this.apiBase}/${col}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`DB.getAll(${col}) failed:`, e);
      return [];
    }
  },

  async getById(col, id) {
    try {
      const res = await fetch(`${this.apiBase}/${col}/${id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`DB.getById(${col}, ${id}) failed:`, e);
      return null;
    }
  },

  async insert(col, data) {
    try {
      const res = await fetch(`${this.apiBase}/${col}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`DB.insert(${col}) failed:`, e);
      return null;
    }
  },

  async update(col, id, data) {
    try {
      const res = await fetch(`${this.apiBase}/${col}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`DB.update(${col}, ${id}) failed:`, e);
      return null;
    }
  },

  async delete(col, id) {
    try {
      const res = await fetch(`${this.apiBase}/${col}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`DB.delete(${col}, ${id}) failed:`, e);
      return null;
    }
  }
};
