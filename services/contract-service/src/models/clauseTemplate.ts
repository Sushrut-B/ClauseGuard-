import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export type ClauseCategory = 'liability' | 'termination' | 'payment' | 'ip' | 'dispute'
export type RiskLevel = 'safe' | 'balanced' | 'caution'

export class ClauseTemplate extends Model {
  declare id: string
  declare category: ClauseCategory
  declare title: string
  declare description: string
  declare text: string
  declare riskLevel: RiskLevel
  declare tags: string[]
  declare createdAt: Date
  declare updatedAt: Date
}

ClauseTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('liability', 'termination', 'payment', 'ip', 'dispute'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.ENUM('safe', 'balanced', 'caution'),
      allowNull: false,
      defaultValue: 'balanced',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'clause_templates',
    timestamps: true,
  }
)