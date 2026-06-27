import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export type ContractStatus = 'uploaded' | 'processing' | 'analyzed' | 'failed'

export class Contract extends Model {
  declare id: string
  declare userId: string
  declare fileName: string
  declare originalName: string
  declare fileSize: number
  declare mimeType: string
  declare status: ContractStatus
  declare extractedText: string | null
  declare pageCount: number | null
  declare createdAt: Date
  declare updatedAt: Date
}

Contract.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'processing', 'analyzed', 'failed'),
      defaultValue: 'uploaded',
    },
    extractedText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pageCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'contracts',
    timestamps: true,
  }
)