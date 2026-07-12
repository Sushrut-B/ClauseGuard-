import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

export class PlaybookRule extends Model {
  declare id: string
  declare userId: string
  declare text: string
  declare category: 'general' | 'payment' | 'liability' | 'termination' | 'ip' | 'dispute'
  declare createdAt: Date
  declare updatedAt: Date
}

PlaybookRule.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    text: { type: DataTypes.STRING, allowNull: false },
    category: { 
      type: DataTypes.ENUM('general', 'payment', 'liability', 'termination', 'ip', 'dispute'), 
      allowNull: false, 
      defaultValue: 'general' 
    },
  },
  { sequelize, tableName: 'playbook_rules', timestamps: true }
)
