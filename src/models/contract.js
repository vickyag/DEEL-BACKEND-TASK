const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./job');

class Contract extends Model {}
Contract.init(
  {
    terms: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status:{
      type: DataTypes.ENUM('new', 'in_progress',' terminated')
    }
  },
  {
    sequelize,
    modelName: 'Contract'
  }
);

Contract.hasMany(Job);
Job.belongsTo(Contract);

module.exports = Contract;