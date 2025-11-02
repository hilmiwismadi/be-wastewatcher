const { pool } = require('../config/database');

class TrashBinModel {
  // Get all trash bins with their current status
  static async getAll() {
    const query = `
      SELECT
        tb.trashbinid,
        tb.name,
        tb.location,
        tb.area,
        tb.floor,
        tb.capacity_liters,
        tb.status as bin_status,
        COUNT(d.deviceid) as device_count,
        COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_devices
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      GROUP BY tb.trashbinid, tb.name, tb.location, tb.area, tb.floor, tb.capacity_liters, tb.status
      ORDER BY tb.name
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get trash bin by ID with detailed information
  static async getById(trashbinid) {
    const query = `
      SELECT
        tb.*,
        json_agg(
          json_build_object(
            'deviceId', d.deviceid,
            'category', d.category,
            'status', d.status,
            'last_maintenance_date', d.last_maintenance_date
          )
        ) FILTER (WHERE d.deviceid IS NOT NULL) as devices
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      WHERE tb.trashbinid = $1
      GROUP BY tb.trashbinid
    `;

    const result = await pool.query(query, [trashbinId]);
    return result.rows[0] || null;
  }

  // Get trash bins with current bin status
  static async getAllWithStatus() {
    const query = `
      SELECT
        tb.trashbinid,
        tb.name,
        tb.location,
        tb.area,
        tb.floor,
        tb.capacity_liters,
        tb.status as bin_status,
        d.deviceid,
        d.category,
        bs.total_weight_kg,
        bs.average_volume_percentage,
        bs.status as fill_status,
        bs.condition,
        bs.last_updated
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      WHERE tb.status = 'active'
      ORDER BY tb.name, d.category
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get trash bins by location/area
  static async getByLocation(area) {
    const query = `
      SELECT
        tb.*,
        COUNT(d.deviceid) as device_count
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      WHERE tb.area ILIKE $1
      GROUP BY tb.trashbinid
      ORDER BY tb.name
    `;

    const result = await pool.query(query, [`%${area}%`]);
    return result.rows;
  }

  // Create new trash bin
  static async create(trashBinData) {
    const {
      trashbinid,
      name,
      location,
      area,
      floor,
      capacity_liters,
      installation_date,
      status = 'active'
    } = trashBinData;

    const query = `
      INSERT INTO TrashBin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [trashbinId, name, location, area, floor, capacity_liters, installation_date, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update trash bin
  static async update(trashbinid, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(trashbinid);
    const query = `
      UPDATE TrashBin
      SET ${fields.join(', ')}
      WHERE trashbinid = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete trash bin
  static async delete(trashbinid) {
    const query = 'DELETE FROM trashbin WHERE trashbinid = $1 RETURNING *';
    const result = await pool.query(query, [trashbinId]);
    return result.rows[0] || null;
  }
}

module.exports = TrashBinModel;