import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

export class Analysis extends Model {
  declare id: string
  declare contractId: string
  declare userId: string
  declare overallScore: number
  declare summary: string
  declare clauses: object
  declare createdAt: Date
  declare updatedAt: Date
}

Analysis.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contractId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    overallScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    clauses: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'analyses',
    timestamps: true,
  }
)