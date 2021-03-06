"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_1 = __importDefault(require("mysql"));
var MySQLTools = (function () {
    function MySQLTools(config, logger) {
        this.config = config;
        this.logger = logger;
        if (config) {
            this.pool = mysql_1.default.createPool(config);
            this.config = config;
        }
        if (logger) {
            this.logger = logger;
        }
    }
    MySQLTools.prototype.conf = function (config) {
        if (config) {
            this.pool = mysql_1.default.createPool(config);
            this.config = config;
            return this;
        }
        else {
            throw new ReferenceError('param lose');
        }
    };
    MySQLTools.prototype.then = function (resolve, reject) {
        if (this.__promise__) {
            return this.__promise__.then(resolve, reject);
        }
        else {
            return Promise.resolve(undefined).then(resolve, reject);
        }
    };
    MySQLTools.prototype.use = function (databaseName) {
        if (databaseName) {
            this.db = databaseName;
            return this;
        }
        else {
            throw new ReferenceError('param lose');
        }
    };
    MySQLTools.prototype.doSql = function (sql, cb) {
        var _this = this;
        if (this.pool) {
            if (cb) {
                this.pool.getConnection(function (getConnectionError, connection) {
                    getConnectionError ? cb(getConnectionError) : '';
                    if (_this.logger) {
                        _this.logger(mysql_1.default.format(sql, []));
                    }
                    connection.query(mysql_1.default.format(sql, []), cb);
                    connection.release();
                });
            }
            else {
                this.__promise__ = new Promise(function (resolve, reject) {
                    _this.pool.getConnection(function (getConnectionError, connection) {
                        getConnectionError ? reject(getConnectionError) : '';
                        if (_this.logger) {
                            _this.logger(mysql_1.default.format(sql, []));
                        }
                        connection.query(mysql_1.default.format(sql, []), function (queryError, results, fields) {
                            resolve({ error: queryError, results: results, fields: fields });
                        });
                        connection.release();
                    });
                });
            }
            return this;
        }
        else {
            throw new ReferenceError('please config first');
        }
    };
    MySQLTools.prototype.create = function (type, name, any, cb) {
        if (this.pool) {
            if (type === 'table') {
                if (name) {
                    var sql = "create table ";
                    if (typeof any === 'object' && any.checkExists === true) {
                        sql += 'if not exists ';
                    }
                    sql += name;
                    if (typeof any === 'object' && any.desc) {
                        sql += '(';
                        var keys = Object.keys(any.desc);
                        for (var i = 0; i < keys.length; i++) {
                            sql += keys[i] + ' ' + any.desc[keys[i]];
                            if (i !== keys.length - 1) {
                                sql += ',';
                            }
                        }
                        sql += ')';
                    }
                    else if (typeof any === 'string') {
                        sql += any;
                    }
                    if (any && typeof any === 'function' || typeof cb === 'function') {
                        return this.doSql(sql, cb || any);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('please input name');
                }
            }
            else if (type === 'database') {
                if (name) {
                    var sql = "create database ";
                    if (any === true) {
                        sql += 'if not exists ';
                    }
                    sql += name;
                    if (typeof any === 'function' || typeof cb === 'function') {
                        return this.doSql(sql, cb || any);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('please input name');
                }
            }
        }
        else {
            throw new Error('please config first');
        }
    };
    MySQLTools.prototype.select = function (exp, table, any, cb) {
        var _a, _b, _c, _d;
        if (this.pool) {
            if (this.config.database || this.db) {
                if (exp && table) {
                    var sql = "select " + exp + " from " + (this.db ? this.db + '.' + table : table);
                    if (any && typeof any === 'object') {
                        if ((_a = any.where) === null || _a === void 0 ? void 0 : _a.main) {
                            sql += ' ';
                            var key = Object.keys(any.where.main)[0];
                            var value = (_b = any.where) === null || _b === void 0 ? void 0 : _b.main[key];
                            typeof value === 'number' ? sql += key + "=" + value : key + "='" + value + "'";
                        }
                        if (((_c = any.where) === null || _c === void 0 ? void 0 : _c.main) && ((_d = any.where) === null || _d === void 0 ? void 0 : _d.ands)) {
                            var pairs = any.where.ands;
                            for (var i = 0; i < pairs.length; i++) {
                                var key = Object.keys(pairs[i])[0];
                                var value = pairs[i][key];
                                typeof value === 'number' ? sql += " and " + key + "=" + value : sql += " and " + key + "='" + value + "'";
                            }
                        }
                        if (any.limit && any.limit.start) {
                            sql = sql + " limit " + any.limit.start + " " + (any.limit.end ? ',' + any.limit.end : '');
                        }
                    }
                    else if (typeof any === 'string') {
                        sql += ' ' + any;
                    }
                    if (any && typeof any === 'function' || typeof cb === 'function') {
                        return this.doSql(sql, cb || any);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('param lost');
                }
            }
            else {
                throw new Error('database not config');
            }
        }
        else {
            throw new Error('please config first');
        }
    };
    MySQLTools.prototype.insert = function (table, pairs, cb) {
        if (this.pool) {
            if (table) {
                if (pairs) {
                    var sql = "insert into " + table + " (" + Object.keys(pairs).join() + ") values (";
                    for (var i = 0; i < Object.keys(pairs).length; i++) {
                        typeof pairs[Object.keys(pairs)[i]] === 'number' ? sql += pairs[Object.keys(pairs)[i]] : sql += "'" + pairs[Object.keys(pairs)[i]] + "'";
                        if (i !== Object.keys(pairs).length - 1) {
                            sql += ',';
                        }
                    }
                    sql += ')';
                    if (cb) {
                        return this.doSql(sql, cb);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('please input data');
                }
            }
            else {
                throw new Error('please input table name');
            }
        }
        else {
            throw new Error('please config first');
        }
    };
    MySQLTools.prototype.update = function (table, pairs, any, cb) {
        if (this.pool) {
            if (table) {
                if (pairs) {
                    var sql = "update " + table + " set ";
                    var keys = Object.keys(pairs);
                    for (var i = 0; i < keys.length; i++) {
                        typeof pairs[keys[i]] === 'number' ? sql += "" + (keys[i] + '=' + pairs[keys[i]]) : sql += keys[i] + '="' + pairs[keys[i]] + "\"";
                        if (i !== Object.keys(pairs).length - 1) {
                            sql += ',';
                        }
                    }
                    if (typeof any === 'object') {
                        sql += ' where ';
                        typeof any.main[Object.keys(any.main)[0]] === 'number' ? sql += Object.keys(any.main)[0] + '=' + any.main[Object.keys(any.main)[0]] : sql += Object.keys(any.main)[0] + '="' + any.main[Object.keys(any.main)[0]] + '"';
                        if (any.ands) {
                            for (var i = 0; i < any.ands.length; i++) {
                                var key = Object.keys(any.ands[i])[0];
                                var value = any.ands[i][key];
                                typeof value === 'number' ? sql += " and " + key + "=" + value : sql += " and " + key + "='" + value + "'";
                            }
                        }
                        if (any.ands && any.or) {
                            var key = any.or.keys()[0];
                            var o = any.or;
                            typeof o[key] === 'number' ? sql += " or " + key + "=" + o[key] : sql += " or " + key + "='" + o[key] + "'";
                        }
                    }
                    else if (typeof any === 'string') {
                        sql += any;
                    }
                    if (typeof any === 'function' || typeof cb === 'function') {
                        return this.doSql(sql, cb || any);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('please input data');
                }
            }
            else {
                throw new Error('please input table name');
            }
        }
        else {
            throw new Error('please config first');
        }
    };
    MySQLTools.prototype.delete = function (table, any, cb) {
        var _a, _b, _c, _d;
        if (this.pool) {
            if (table) {
                var sql = "delete from " + table;
                if (typeof any === 'object') {
                    if ((_a = any.where) === null || _a === void 0 ? void 0 : _a.main) {
                        sql += ' ';
                        var key = Object.keys(any.where.main)[0];
                        var value = (_b = any.where) === null || _b === void 0 ? void 0 : _b.main[key];
                        typeof value === 'number' ? sql += key + "=" + value : key + "='" + value + "'";
                    }
                    if (((_c = any.where) === null || _c === void 0 ? void 0 : _c.main) && ((_d = any.where) === null || _d === void 0 ? void 0 : _d.ands)) {
                        var keys = Object.keys(any.where.ands);
                        for (var i = 0; i < keys.length; i++) {
                            typeof any.where.ands[i][keys[i]] === 'number' ? sql += " and " + keys[i] + "=" + any.where.ands[i][keys[i]] : sql += " and " + keys[i] + "='" + any.where.ands[i][keys[i]] + "'";
                        }
                    }
                }
                if (typeof any === 'function' || typeof cb === 'function') {
                    return this.doSql(sql, cb || any);
                }
                else {
                    return this.doSql(sql);
                }
            }
            else {
                throw new ReferenceError('please input table name');
            }
        }
        else {
            throw new ReferenceError('please config first');
        }
    };
    MySQLTools.prototype.drop = function (type, name, any, cb) {
        if (this.pool) {
            if (type === 'database' || type === 'table') {
                if (name) {
                    var sql = "drop " + type + " ";
                    if (any === true) {
                        sql += 'if exists ';
                    }
                    sql += name;
                    if (typeof cb === 'function' || typeof any === 'function') {
                        return this.doSql(sql, cb || any);
                    }
                    else {
                        return this.doSql(sql);
                    }
                }
                else {
                    throw new Error('please input name');
                }
            }
            else {
                throw new Error('type is not support');
            }
        }
        else {
            throw new Error('please config first');
        }
    };
    MySQLTools.prototype.truncate = function (type, name, cb) {
        if (type) {
            if (name) {
                var sql = "truncate " + type + " " + name;
                if (typeof cb === 'function') {
                    return this.doSql(sql, cb);
                }
                else {
                    return this.doSql(sql);
                }
            }
            else {
                throw new Error('please input name');
            }
        }
        else {
            throw new Error('please input type');
        }
    };
    return MySQLTools;
}());
module.exports = MySQLTools;