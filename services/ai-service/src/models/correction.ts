import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

export class Correction extends Model {
  declare id: string
  declare contractId: string
  declare userId: string
  declare clauseText: string
  declare category: string
  declare originalSeverity: string
  declare correctedSeverity: string
  declare originalSuggestion: string
  declare correctedSuggestion: string
}

Correction.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contractId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    clauseText: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    originalSeverity: { type: DataTypes.STRING, allowNull: true },
    correctedSeverity: { type: DataTypes.STRING, allowNull: true },
    originalSuggestion: { type: DataTypes.TEXT, allowNull: true },
    correctedSuggestion: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'corrections', timestamps: true }
)
