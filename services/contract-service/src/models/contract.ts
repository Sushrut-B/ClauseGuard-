import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export class Contract extends Model {
  declare id: string
  declare title: string
  declare content: string
  declare status: 'draft' | 'active' | 'expired' | 'terminated'
  declare userId: string
  declare orgId: string
  declare fileUrl: string | null
  declare expiresAt: Date | null
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'expired', 'terminated'),
      defaultValue: 'draft',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'contracts',
    timestamps: true,
  }
)