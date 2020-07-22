/*
 * @Author: iy88 
 * @Date: 2020-07-21 22:04:11 
 * @Last Modified by: iy88
 * @Last Modified time: 2020-07-22 16:46:42
 */
const mysql = require('mysql')

/**
 * @constructor MySQLTools
 */
class MySQLTools {
  /**
   *
   * @param config
   */
  constructor(config, logger) {
    if (config) {
      this.pool = mysql.createPool(config);
      this.config = config;
    }
    if (logger) {
      this.logger = logger;
    }
  }

  /**
   *
   * @param config
   * @returns {MySQLTools}
   */
  conf(config) {
    if (config) {
      this.pool = mysql.createPool(config);
      this.config = config;
      return this
    } else {
      throw new Error('param lost');
    }
  }

  /**
   *
   * @param resolve
   * @param reject
   * @returns {Promise|*}
   */
  then(resolve, reject) {
    if (this.__promise__) {
      return this.__promise__.then(resolve, reject);
    } else {
      return Promise.resolve().then(resolve, reject);
    }
  }

  /**
   *
   * @param databaseName
   * @returns {MySQLTools}
   */
  use(databaseName) {
    if (databaseName) {
      this.db = databaseName;
      return this
    } else {
      throw new Error('param lost');
    }
  }

  /**
   *
   * @param sql
   * @param cb
   * @returns {MySQLTools}
   */
  doSql(sql, cb) {
    if (this.pool) {
      if (cb) {
        this.pool.getConnection((getConnectionError, connection) => {
          getConnectionError ? cb(getConnectionError) : '';
          if (this.logger) {
            this.logger(mysql.format(sql));
          }
          connection.query(mysql.format(sql), cb);
        })
      } else {
        this.__promise__ = new Promise((resolve, reject) => {
          this.pool.getConnection((getConnectionError, connection) => {
            getConnectionError ? reject(getConnectionError) : '';
            if (this.logger) {
              this.logger(mysql.format(sql));
            }
            connection.query(mysql.format(sql), (queryError, results, fields) => {
              resolve({ error: queryError, results, fields })
            });
          })
        });
      }
      return this
    } else {
      throw new Error('please config first');
    }
  }

  /**
   *
   * @param exp
   * @param table
   * @param any
   * @param cb
   * @returns {MySQLTools}
   */
  select(exp, table, any, cb) {
    if (this.pool) {
      if (this.config.database || this.db) {
        if (exp && table) {
          let sql = `select ${exp} from ${this.db ? this.db + '.' + table : table}`;
          if (any && typeof any === 'object') {
            if (any.where) {
              any.where.condition ? sql += ` where ${any.where.condition}` : '';
              any.where.and ? sql += ` and ${any.where.and}` : '';
              any.where.or ? sql += ` or ${any.where.or}` : '';
            }
            if (any.limit && any.limit.start) {
              sql = `${sql} limit ${any.limit.start} ${any.limit.end ? ','+any.limit.end : ''}`;
            }
          } else if (typeof any === 'string') {
            sql += ' ' + any;
          }
          if (any && typeof any === 'function' || typeof cb === 'function') {
            return this.doSql(sql, cb || any);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('param lost');
        }
      } else {
        throw new Error('database not config');
      }
    } else {
      throw new Error('please config first');
    }
  }

  /**
   *
   * @param type
   * @param name
   * @param any
   * @param cb
   * @returns {MySQLTools}
   */
  create(type, name, any, cb) {
    if (this.pool) {
      if (type === 'table') {
        if (name) {
          let sql = `create table `;
          if (typeof any === 'object' && any.checkExists === true) {
            sql += 'if not exists ';
          }
          sql += name;
          if (typeof any === 'object' && any.desc) {
            sql += '(';
            let keys = Object.keys(any.desc);
            for (let i = 0; i < keys.length; i++) {
              sql += keys[i] + ' ' + any.desc[keys[i]];
              if (i !== keys.length - 1) {
                sql += ',';
              }
            }
            sql += ')';
          } else if (typeof any === 'string') {
            sql += any;
          }
          if (any && typeof any === 'function' || typeof cb === 'function') {
            return this.doSql(sql, cb || any);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('please input name');
        }
      } else if (type === 'database') {
        if (name) {
          let sql = `create database `;
          if (any === true) {
            sql += 'if not exists ';
          }
          sql += name;
          if (typeof any === 'function' || typeof cb === 'function') {
            return this.doSql(sql, cb || any);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('please input name');
        }
      }
    } else {
      throw new Error('please config first');
    }
  }

  /**
   * 
   * @param {String} type 
   * @param {String} name 
   * @param {Function} cb 
   * @returns {MySQLTools}
   */
  drop(type, name, any, cb) {
    if (this.pool) {
      if (type === 'database' || type === 'table') {
        if (name) {
          let sql = `drop ${type} `;
          if (any === true) {
            sql += 'if exists ';
          }
          sql += name;
          if (typeof cb === 'function' || typeof any === 'function') {
            return this.doSql(sql, cb || any);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('please input name');
        }
      } else {
        throw new Error('type is not support');
      }
    } else {
      throw new Error('please config first');
    }
  }

  /**
   * 
   * @param {String} table 
   * @param {Object} pairs 
   * @param {Function} cb 
   */
  insert(table, pairs, cb) {
    if (this.pool) {
      if (table) {
        if (pairs) {
          let sql = `insert into ${table} (${Object.keys(pairs).join()}) values (`;
          for (let i = 0; i < Object.keys(pairs).length; i++) {
            typeof pairs[Object.keys(pairs)[i]] === 'number' ? sql += pairs[Object.keys(pairs)[i]] : sql += `'${pairs[Object.keys(pairs)[i]]}'`;
            if (i !== Object.keys(pairs).length - 1) {
              sql += ',';
            }
          }
          sql += ')';
          if (cb) {
            return this.doSql(sql, cb);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('please input data');
        }
      } else {
        throw new Error('please input table name');
      }

    } else {
      throw new Error('please config first');
    }
  }

  update(table, pairs, any, cb) {
    if (this.pool) {
      if (table) {
        if (pairs) {
          let sql = `update ${table} set `
          let keys = Object.keys(pairs);
          for (let i = 0; i < keys.length; i++) {
            typeof pairs[keys[i]] === 'number' ? sql += `${keys[i] + '=' + pairs[keys[i]]}` : sql += `${keys[i] + '="' + pairs[keys[i]]}"`;
            if (i !== Object.keys(pairs).length - 1) {
              sql += ',';
            }
          }
          if (typeof any === 'object') {
            sql += ' where ';
            typeof any.main[Object.keys(any.main)[0]] === 'number' ? sql += Object.keys(any.main)[0] + '=' + any.main[Object.keys(any.main)[0]] : sql += Object.keys(any.main)[0] + '="' + any.main[Object.keys(any.main)[0]] + '"';
            if (any.ands) {
              for (let i = 0; i < any.ands.length; i++) {
                let key = Object.keys(any.ands[i])[0];
                let value = any.ands[i][key];
                typeof value === 'number' ? sql += ` and ${key}=${value}` : sql += ` and ${key}='${value}'`;
              }
            }
            if (any.ands && any.or) {
              let key = any.or.keys()[0];
              let o = any.or;
              typeof o[key] === 'number' ? sql += ` or ${key}=${o[key]}` : sql += ` or ${key}='${o[key]}'`;
            }
          } else if (typeof any === 'string') {
            sql += any;
          }
          if (typeof any === 'function' || typeof cb === 'function') {
            return this.doSql(sql, cb || any);
          } else {
            return this.doSql(sql);
          }
        } else {
          throw new Error('please input data');
        }
      } else {
        throw new Error('please input table name')
      }
    } else {
      throw new Error('please config first');
    }
  }
  truncate(type, name, cb) {
    if (type) {
      if (name) {
        let sql = `truncate ${type} ${name}`;
        if (typeof cb === 'function') {
          return this.doSql(sql, cb);
        } else {
          return this.doSql(sql);
        }
      } else {
        throw new Error('please input name');
      }
    } else {
      throw new Error('please input type');
    }
  }
}
module.exports = MySQLTools;