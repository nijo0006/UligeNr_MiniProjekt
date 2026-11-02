export class BarRepository {
  constructor(database) { this.database = database; }
  async catalog() {
    const { rows } = await this.database.query('SELECT id AS "drinkId",name,category,unit_price AS "unitPrice" FROM drinks ORDER BY category,name');
    return rows;
  }
  async daily(date) {
    const { rows } = await this.database.query('SELECT drink_id AS "drinkId",quantity,unit_price_snapshot AS "unitPrice",exact_revenue AS revenue,synthetic,source_id AS "sourceId" FROM daily_bar_sales WHERE sales_date=$1 ORDER BY drink_id',[date]);
    return { salesDate:date,sales:rows };
  }
  async save(date, id, quantity) {
    const { rows } = await this.database.query(`INSERT INTO daily_bar_sales (sales_date,drink_id,quantity,unit_price_snapshot,exact_revenue)
      SELECT $1::date,id,$3::bigint,unit_price,unit_price*($3::bigint) FROM drinks WHERE id=$2
      ON CONFLICT (sales_date,drink_id) DO UPDATE SET quantity=EXCLUDED.quantity,
      exact_revenue=daily_bar_sales.unit_price_snapshot*EXCLUDED.quantity
      RETURNING sales_date AS "salesDate",drink_id AS "drinkId",quantity,unit_price_snapshot AS "unitPrice",exact_revenue AS revenue,synthetic,source_id AS "sourceId"`,[date,id,quantity]);
    return rows[0];
  }
  async annual(start,end) {
    const { rows } = await this.database.query(`SELECT d.id AS "drinkId",d.name,d.category,
      SUM(s.quantity)::bigint AS units,SUM(s.exact_revenue)::text AS revenue,COALESCE(BOOL_OR(s.synthetic),FALSE) AS synthetic
      FROM drinks d LEFT JOIN daily_bar_sales s ON s.drink_id=d.id AND s.sales_date >= $1::date AND s.sales_date < $2::date
      GROUP BY d.id ORDER BY d.category,d.name`,[start,end]);
    return rows;
  }
}
